"""
ProphetModel — seasonal price forecasting using Facebook Prophet.
Captures weekly, monthly, and annual seasonality in crop price data.
"""

import os
import pickle
from datetime import date
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from loguru import logger

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("Prophet not available — using trend-only fallback")


MODEL_STORE_DIR = Path(os.getenv("MODEL_STORE_DIR", "models/prophet"))


class ProphetModel:
    """
    Wraps Facebook Prophet for mandi price forecasting.
    One model is trained per (crop_id, mandi_id) pair and stored to disk.
    """

    def __init__(self) -> None:
        MODEL_STORE_DIR.mkdir(parents=True, exist_ok=True)
        self._models: dict[str, "Prophet"] = {}

    def _model_key(self, crop_id: str, mandi_id: str) -> str:
        """Unique string key for a crop-mandi pair."""
        return f"{crop_id}_{mandi_id}"

    def _model_path(self, crop_id: str, mandi_id: str) -> Path:
        """File path for serialised Prophet model."""
        return MODEL_STORE_DIR / f"prophet_{self._model_key(crop_id, mandi_id)}.pkl"

    def train(self, crop_id: str, mandi_id: str, historical_prices: pd.DataFrame) -> None:
        """
        Trains a Prophet model on historical price data.
        Requires a DataFrame with 'ds' (datetime) and 'y' (price per kg) columns.
        """
        if not PROPHET_AVAILABLE:
            logger.warning("Skipping Prophet training — library not available")
            return

        if len(historical_prices) < 30:
            logger.warning(f"Insufficient data to train Prophet for {crop_id}/{mandi_id}: {len(historical_prices)} rows")
            return

        logger.info(f"Training Prophet model for crop={crop_id}, mandi={mandi_id} ({len(historical_prices)} rows)")

        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode="multiplicative",
            changepoint_prior_scale=0.05,  # Lower = less flexible, prevents overfitting
            interval_width=0.80,
        )

        # Add Indian harvest season regressors
        model.add_seasonality(name="monthly", period=30.5, fourier_order=5)

        model.fit(historical_prices[["ds", "y"]])

        self._models[self._model_key(crop_id, mandi_id)] = model
        self.save_model(crop_id, mandi_id)
        logger.info(f"Prophet model trained and saved for {crop_id}/{mandi_id}")

    def predict(
        self,
        crop_id: str,
        mandi_id: str,
        target_date: date,
        historical_prices: pd.DataFrame,
    ) -> dict[str, float]:
        """
        Predicts the price for a given harvest date.
        Returns dict with keys: predicted_price, lower_bound, upper_bound
        """
        key = self._model_key(crop_id, mandi_id)

        # Attempt to load a saved model if not in memory
        if key not in self._models:
            self._load_model(crop_id, mandi_id)

        if key not in self._models or not PROPHET_AVAILABLE:
            return self._fallback_prediction(historical_prices)

        model = self._models[key]
        future = pd.DataFrame({"ds": [pd.Timestamp(target_date)]})
        forecast = model.predict(future)

        row = forecast.iloc[0]
        predicted = float(row["yhat"])
        lower = float(row["yhat_lower"])
        upper = float(row["yhat_upper"])

        # Clamp to sane bounds (price can't be negative)
        return {
            "predicted_price": max(1.0, predicted),
            "lower_bound": max(1.0, lower),
            "upper_bound": max(1.0, upper),
        }

    def save_model(self, crop_id: str, mandi_id: str) -> None:
        """Serialises the trained model to disk."""
        key = self._model_key(crop_id, mandi_id)
        if key not in self._models:
            return
        path = self._model_path(crop_id, mandi_id)
        with open(path, "wb") as f:
            pickle.dump(self._models[key], f)

    def _load_model(self, crop_id: str, mandi_id: str) -> None:
        """Loads a previously saved model from disk."""
        path = self._model_path(crop_id, mandi_id)
        if not path.exists():
            return
        try:
            with open(path, "rb") as f:
                self._models[self._model_key(crop_id, mandi_id)] = pickle.load(f)
            logger.info(f"Loaded Prophet model from {path}")
        except Exception as exc:
            logger.warning(f"Failed to load Prophet model from {path}: {exc}")

    def _fallback_prediction(self, historical_prices: pd.DataFrame) -> dict[str, float]:
        """Simple moving-average fallback when Prophet is unavailable."""
        if historical_prices.empty:
            return {"predicted_price": 20.0, "lower_bound": 15.0, "upper_bound": 25.0}

        recent = historical_prices["y"].tail(30)
        mean = float(recent.mean())
        std = float(recent.std()) if len(recent) > 1 else mean * 0.15

        return {
            "predicted_price": mean,
            "lower_bound": max(1.0, mean - 1.5 * std),
            "upper_bound": mean + 1.5 * std,
        }
