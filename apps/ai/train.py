"""
KrishiMitra — Synthetic Data Training Script
=============================================
Generates realistic Indian mandi price data and trains:
  1. Prophet models  (one per crop, saved to models/prophet/)
  2. XGBoost model   (single global model, saved to models/xgboost/)

Run from apps/ai/:
    python train.py

No database connection required — all data is synthetic.
"""

import os
import pickle
import sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from loguru import logger

# ── Optional deps — fail gracefully ──────────────────────────────────────────
try:
    from prophet import Prophet
    PROPHET_OK = True
except ImportError:
    PROPHET_OK = False
    logger.warning("prophet not installed — skipping Prophet training (pip install prophet)")

try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    XGB_OK = True
except ImportError:
    XGB_OK = False
    logger.warning("xgboost/scikit-learn not installed — skipping XGBoost training")

# ── Directories ───────────────────────────────────────────────────────────────
PROPHET_DIR = Path("models/prophet")
XGBOOST_DIR = Path("models/xgboost")
PROPHET_DIR.mkdir(parents=True, exist_ok=True)
XGBOOST_DIR.mkdir(parents=True, exist_ok=True)

# ── Realistic Indian crop price profiles ─────────────────────────────────────
# base_price: modal price INR/kg
# volatility:  std dev as fraction of base price
# seasonal_amp: how much price swings seasonally (0-1 fraction of base)
# peak_doy:    day-of-year where price is highest (scarcity peak)
# category:    used for XGBoost feature engineering

CROP_PROFILES = [
    # id (used for model filename), display name, base_price, volatility, seasonal_amp, peak_doy, category
    ("tomato",      "Tomato",      25.0, 0.30, 0.55, 300, "VEGETABLE"),  # peaks Nov-Dec, glut Apr
    ("onion",       "Onion",       20.0, 0.25, 0.50, 210, "VEGETABLE"),  # peaks Jul-Aug
    ("potato",      "Potato",      15.0, 0.15, 0.30, 180, "VEGETABLE"),  # stable, slight summer peak
    ("brinjal",     "Brinjal",     20.0, 0.25, 0.35, 270, "VEGETABLE"),
    ("bhindi",      "Bhindi",      30.0, 0.20, 0.35, 240, "VEGETABLE"),
    ("cauliflower", "Cauliflower", 22.0, 0.25, 0.40, 330, "VEGETABLE"),  # winter crop
    ("spinach",     "Spinach",     18.0, 0.20, 0.30, 330, "VEGETABLE"),
    ("green_chilli","GreenChilli", 45.0, 0.35, 0.60, 200, "VEGETABLE"),  # very volatile
    ("garlic",      "Garlic",      60.0, 0.30, 0.50, 180, "VEGETABLE"),
    ("ginger",      "Ginger",      50.0, 0.25, 0.40, 300, "VEGETABLE"),
    # Grains — stable, harvest-driven
    ("rice",        "Rice",        30.0, 0.08, 0.20, 150, "GRAIN"),     # peaks pre-kharif harvest
    ("wheat",       "Wheat",       24.0, 0.07, 0.18, 270, "GRAIN"),     # peaks pre-rabi harvest
    ("maize",       "Maize",       18.0, 0.10, 0.22, 150, "GRAIN"),
    ("jowar",       "Jowar",       22.0, 0.10, 0.20, 150, "GRAIN"),
    ("bajra",       "Bajra",       20.0, 0.10, 0.18, 150, "GRAIN"),
    # Pulses — moderate volatility
    ("chickpea",    "Chickpea",    65.0, 0.12, 0.25, 270, "PULSE"),
    ("pigeon_pea",  "PigeonPea",   80.0, 0.15, 0.28, 200, "PULSE"),
    ("green_gram",  "GreenGram",   70.0, 0.12, 0.22, 200, "PULSE"),
    # Oilseeds
    ("mustard",     "Mustard",     55.0, 0.10, 0.20, 270, "OILSEED"),
    ("soybean",     "Soybean",     42.0, 0.10, 0.22, 150, "OILSEED"),
    ("groundnut",   "Groundnut",   50.0, 0.12, 0.25, 300, "OILSEED"),
    # Fruits — premium pricing
    ("tomato_hv",   "TomatoHV",    35.0, 0.35, 0.65, 310, "FRUIT"),    # high-value variety
    ("banana",      "Banana",      28.0, 0.12, 0.20, 200, "FRUIT"),
    ("pomegranate", "Pomegranate", 90.0, 0.18, 0.30, 300, "FRUIT"),
    # Spices — high value, seasonal
    ("turmeric",    "Turmeric",    80.0, 0.20, 0.35, 270, "SPICE"),
    ("coriander",   "Coriander",   55.0, 0.25, 0.45, 200, "SPICE"),
    ("cumin",       "Cumin",      180.0, 0.22, 0.40, 180, "SPICE"),
    ("red_chilli",  "RedChilli",  100.0, 0.28, 0.50, 210, "SPICE"),
]

# Mandis we simulate (just IDs for model-file naming)
MANDI_IDS = [
    "kolar", "mysore", "pune", "nashik",
    "hyderabad", "chennai", "coimbatore", "nagpur",
]

XGBOOST_FEATURES = [
    "harvest_month", "harvest_quarter", "harvest_day_of_year",
    "avg_price_1yr", "price_std_1yr", "price_30d_avg",
    "price_momentum", "weather_risk_score",
    "land_size_acres", "input_cost_per_acre",
    "is_rabi_season", "is_kharif_season",
]


# ─────────────────────────────────────────────────────────────────────────────
# Synthetic data generator
# ─────────────────────────────────────────────────────────────────────────────

def generate_price_series(
    base_price: float,
    volatility: float,
    seasonal_amp: float,
    peak_doy: int,
    days: int = 730,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generates a realistic daily price series for a crop.

    Combines:
      - Long-term slight uptrend (inflation ~5% per year)
      - Primary annual seasonal cycle (sine wave peaking at peak_doy)
      - Secondary half-year cycle (smaller)
      - GARCH-like volatility clustering (bad weeks cluster)
      - Random spike events (market disruptions, transport strikes, etc.)
      - Trend reversals at harvest glut periods
    """
    rng = np.random.default_rng(seed)
    today = date.today()
    start = today - timedelta(days=days)
    dates = pd.date_range(start=start, periods=days, freq="D")

    prices = np.zeros(days)

    for i, dt in enumerate(dates):
        doy = dt.day_of_year
        t = i / 365.0  # years elapsed

        # Inflation trend
        trend = base_price * (1 + 0.05 * t)

        # Primary seasonal: sine wave — high at peak_doy, low 180 days away
        primary = seasonal_amp * base_price * np.sin(
            2 * np.pi * (doy - peak_doy) / 365
        )

        # Secondary half-year cycle (smaller amplitude)
        secondary = 0.15 * seasonal_amp * base_price * np.sin(
            4 * np.pi * (doy - peak_doy) / 365
        )

        # Daily noise (scales with price for log-normal-like behaviour)
        current_base = trend + primary + secondary
        noise = rng.normal(0, volatility * current_base * 0.3)

        price = max(3.0, current_base + noise)
        prices[i] = round(price, 2)

    # Add volatility clustering: ~10 random "shock" weeks per 2 years
    n_shocks = int(days / 73)  # ~10 shocks per 2-year period
    shock_starts = rng.integers(0, days - 7, size=n_shocks)
    for s in shock_starts:
        shock_magnitude = rng.choice([-1, 1]) * rng.uniform(0.15, 0.45) * base_price
        duration = rng.integers(5, 21)
        end = min(s + duration, days)
        prices[s:end] = np.clip(prices[s:end] + shock_magnitude, 3.0, base_price * 5)

    # Smooth a tiny bit (3-day moving average) to remove single-day outliers
    prices = pd.Series(prices).rolling(window=3, min_periods=1, center=True).mean().values

    arrivals = rng.uniform(10, 300, size=days).round(1)

    return pd.DataFrame({"ds": dates, "y": np.round(prices, 2), "arrivals_tonnes": arrivals})


# ─────────────────────────────────────────────────────────────────────────────
# Prophet training
# ─────────────────────────────────────────────────────────────────────────────

def train_prophet_models() -> None:
    if not PROPHET_OK:
        logger.warning("Skipping Prophet — library not available")
        return

    logger.info(f"Training Prophet models for {len(CROP_PROFILES)} crops × {len(MANDI_IDS)} mandis...")

    trained = 0
    for idx, (crop_id, name, base, vol, amp, peak, _cat) in enumerate(CROP_PROFILES):
        for mandi_id in MANDI_IDS:
            model_path = PROPHET_DIR / f"prophet_{crop_id}_{mandi_id}.pkl"

            # Use a different seed per crop+mandi combo for variety
            seed = hash(f"{crop_id}{mandi_id}") % (2**31)
            df = generate_price_series(base, vol, amp, peak, days=730, seed=abs(seed))

            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode="multiplicative",
                changepoint_prior_scale=0.05,
                interval_width=0.80,
            )
            model.add_seasonality(name="monthly", period=30.5, fourier_order=5)

            # Suppress Prophet's verbose output
            import logging
            logging.getLogger("prophet").setLevel(logging.ERROR)
            logging.getLogger("cmdstanpy").setLevel(logging.ERROR)

            model.fit(df[["ds", "y"]])

            with open(model_path, "wb") as f:
                pickle.dump(model, f)

            trained += 1
            logger.info(
                f"  [{trained}/{len(CROP_PROFILES) * len(MANDI_IDS)}] "
                f"Prophet: {name} @ {mandi_id} — base ₹{base}/kg"
            )

    logger.success(f"Prophet: {trained} models saved to {PROPHET_DIR}/")


# ─────────────────────────────────────────────────────────────────────────────
# XGBoost training
# ─────────────────────────────────────────────────────────────────────────────

def build_xgboost_dataset() -> tuple[pd.DataFrame, pd.Series]:
    """
    Generates a large synthetic dataset of (features, price) pairs for XGBoost.

    For every crop+mandi combo we generate N harvest scenarios at different
    dates spread across 2 years. Each scenario samples from the price series
    at that harvest date to create a realistic training row.
    """
    rows = []
    rng = np.random.default_rng(99)

    for crop_id, name, base, vol, amp, peak, category in CROP_PROFILES:
        for mandi_id in MANDI_IDS:
            seed = abs(hash(f"{crop_id}{mandi_id}xgb")) % (2**31)
            df = generate_price_series(base, vol, amp, peak, days=730, seed=seed)

            # Simulate 60 different harvest dates spread across the price series
            for _ in range(60):
                # Pick a harvest index (need at least 365 days of history before it)
                harvest_idx = rng.integers(365, len(df) - 1)
                harvest_row = df.iloc[harvest_idx]
                harvest_dt = pd.Timestamp(harvest_row["ds"])
                actual_price = float(harvest_row["y"])

                # History available up to harvest day
                history = df.iloc[: harvest_idx]
                avg_price_1yr = float(history["y"].tail(365).mean())
                price_std_1yr = float(history["y"].tail(365).std())
                price_30d_avg = float(history["y"].tail(30).mean())
                price_momentum = (price_30d_avg - avg_price_1yr) / (avg_price_1yr + 1e-9)

                # Realistic farm parameters
                land_size = float(rng.uniform(0.5, 10.0))
                input_cost = land_size * rng.uniform(8_000, 40_000)  # INR/acre varies by crop
                weather_risk = float(rng.beta(2, 5))  # skewed toward low risk

                harvest_month = harvest_dt.month
                harvest_quarter = harvest_dt.quarter
                harvest_doy = harvest_dt.day_of_year

                rows.append({
                    "harvest_month": harvest_month,
                    "harvest_quarter": harvest_quarter,
                    "harvest_day_of_year": harvest_doy,
                    "avg_price_1yr": avg_price_1yr,
                    "price_std_1yr": price_std_1yr,
                    "price_30d_avg": price_30d_avg,
                    "price_momentum": price_momentum,
                    "weather_risk_score": weather_risk,
                    "land_size_acres": land_size,
                    "input_cost_per_acre": input_cost / land_size,
                    "is_rabi_season": 1 if harvest_month in [11, 12, 1, 2, 3] else 0,
                    "is_kharif_season": 1 if harvest_month in [6, 7, 8, 9, 10] else 0,
                    "_actual_price": actual_price,
                })

    df_all = pd.DataFrame(rows)
    X = df_all[XGBOOST_FEATURES]
    y = df_all["_actual_price"]
    logger.info(f"XGBoost dataset: {len(df_all):,} rows × {len(XGBOOST_FEATURES)} features")
    return X, y


def train_xgboost_model() -> None:
    if not XGB_OK:
        logger.warning("Skipping XGBoost — library not available")
        return

    logger.info("Building XGBoost training dataset...")
    X, y = build_xgboost_dataset()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y, test_size=0.15, random_state=42
    )

    logger.info(f"Training XGBoost: {len(X_train):,} train / {len(X_val):,} val rows")

    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.04,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        verbosity=0,
        eval_metric="mae",
        early_stopping_rounds=30,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )

    val_pred = model.predict(X_val)
    mae = float(np.mean(np.abs(val_pred - y_val)))
    r2 = float(1 - np.sum((val_pred - y_val) ** 2) / np.sum((y_val - y_val.mean()) ** 2))
    logger.success(f"XGBoost validation — MAE: ₹{mae:.2f}/kg   R²: {r2:.4f}")

    # Feature importances
    importances = dict(zip(XGBOOST_FEATURES, model.feature_importances_))
    top = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
    logger.info("Top 5 features: " + "  |  ".join(f"{k}: {v:.3f}" for k, v in top))

    model_path = XGBOOST_DIR / "xgboost_model.pkl"
    scaler_path = XGBOOST_DIR / "xgboost_scaler.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)

    logger.success(f"XGBoost model saved to {XGBOOST_DIR}/")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("KrishiMitra — Model Training")
    logger.info(f"Crops: {len(CROP_PROFILES)}   Mandis: {len(MANDI_IDS)}")
    logger.info("=" * 60)

    # XGBoost first (faster)
    train_xgboost_model()

    # Prophet (slower — ~2-5 min for all combos)
    logger.info("")
    logger.info("Starting Prophet training (this takes a few minutes)...")
    train_prophet_models()

    logger.info("")
    logger.info("=" * 60)
    logger.success("Training complete!")
    logger.info(f"  Prophet models : {PROPHET_DIR}/")
    logger.info(f"  XGBoost model  : {XGBOOST_DIR}/")
    logger.info("")
    logger.info("NOTE: These models use synthetic IDs (e.g. 'tomato', 'kolar').")
    logger.info("The live prediction service uses real PostgreSQL UUIDs from the DB.")
    logger.info("Until real price data is ingested, the DataService fallback")
    logger.info("generates synthetic prices on-the-fly — so predictions work")
    logger.info("out of the box. XGBoost (global model) is used immediately.")
    logger.info("=" * 60)
