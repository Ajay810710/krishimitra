"""
XGBoostModel — gradient boosting price adjustment model.
Takes engineered features (season, weather, market momentum) and adjusts the
base Prophet forecast to account for non-seasonal market dynamics.
"""

import os
import pickle
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from loguru import logger
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available — using linear fallback")

MODEL_STORE_DIR = Path(os.getenv("MODEL_STORE_DIR", "models/xgboost"))

# Feature columns expected by the model
FEATURE_COLUMNS = [
    "harvest_month",
    "harvest_quarter",
    "harvest_day_of_year",
    "avg_price_1yr",
    "price_std_1yr",
    "price_30d_avg",
    "price_momentum",
    "weather_risk_score",
    "land_size_acres",
    "input_cost_per_acre",
    "is_rabi_season",
    "is_kharif_season",
]


class XGBoostModel:
    """
    XGBoost model for price adjustment factor prediction.
    Trained per crop category (not per crop) for better generalisation.
    """

    def __init__(self) -> None:
        MODEL_STORE_DIR.mkdir(parents=True, exist_ok=True)
        self._model: Optional["xgb.XGBRegressor"] = None
        self._scaler: Optional[StandardScaler] = None
        self._is_fitted = False

    def train(self, features_df: pd.DataFrame, target: pd.Series) -> None:
        """
        Trains the XGBoost regressor.
        target should be the actual price (INR/kg) for each feature row.
        """
        if not XGBOOST_AVAILABLE:
            logger.warning("XGBoost training skipped — library not available")
            return

        logger.info(f"Training XGBoost model on {len(features_df)} samples")

        X = features_df[FEATURE_COLUMNS].values
        y = target.values

        # Scale features for better convergence
        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

        self._model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            verbosity=0,
        )

        self._model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

        self._is_fitted = True

        val_pred = self._model.predict(X_val)
        mae = float(np.mean(np.abs(val_pred - y_val)))
        logger.info(f"XGBoost trained — validation MAE: ₹{mae:.2f}/kg")

        self._save()

    def predict(self, feature_df: pd.DataFrame) -> float:
        """
        Predicts price per kg from a single feature row.
        Returns a scalar price value in INR/kg.
        """
        if not self._is_fitted or self._model is None:
            self._load()

        if not self._is_fitted:
            return self._fallback_predict(feature_df)

        X = feature_df[FEATURE_COLUMNS].values
        if self._scaler is not None:
            X = self._scaler.transform(X)

        prediction = float(self._model.predict(X)[0])
        return max(1.0, prediction)

    def _save(self) -> None:
        """Persists model and scaler to disk."""
        model_path = MODEL_STORE_DIR / "xgboost_model.pkl"
        scaler_path = MODEL_STORE_DIR / "xgboost_scaler.pkl"

        with open(model_path, "wb") as f:
            pickle.dump(self._model, f)
        with open(scaler_path, "wb") as f:
            pickle.dump(self._scaler, f)

    def _load(self) -> None:
        """Loads model and scaler from disk."""
        model_path = MODEL_STORE_DIR / "xgboost_model.pkl"
        scaler_path = MODEL_STORE_DIR / "xgboost_scaler.pkl"

        if not model_path.exists():
            return

        try:
            with open(model_path, "rb") as f:
                self._model = pickle.load(f)
            if scaler_path.exists():
                with open(scaler_path, "rb") as f:
                    self._scaler = pickle.load(f)
            self._is_fitted = True
            logger.info("XGBoost model loaded from disk")
        except Exception as exc:
            logger.warning(f"Failed to load XGBoost model: {exc}")

    def _fallback_predict(self, feature_df: pd.DataFrame) -> float:
        """Returns a simple average-based fallback prediction."""
        avg_price = float(feature_df.get("avg_price_1yr", pd.Series([20.0])).iloc[0])
        return avg_price
