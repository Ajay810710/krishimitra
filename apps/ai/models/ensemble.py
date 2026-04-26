"""
EnsembleModel — combines Prophet + XGBoost outputs into a final price forecast.
Weights: Prophet 60% (seasonal baseline) + XGBoost 40% (market adjustment)
"""

from datetime import date
from typing import Any

import numpy as np
import pandas as pd
from loguru import logger

from models.prophet_model import ProphetModel
from models.xgboost_model import XGBoostModel
from services.data_service import DataService


class EnsembleModel:
    """
    Weighted ensemble of Prophet and XGBoost models.
    Prophet captures long-term seasonality; XGBoost handles market dynamics.
    """

    # Blend weights — must sum to 1.0
    PROPHET_WEIGHT = 0.60
    XGBOOST_WEIGHT = 0.40

    # Typical yield estimates per crop category (tons per acre)
    DEFAULT_YIELD_TONS_ACRE = 12.0

    def __init__(self) -> None:
        self.prophet = ProphetModel()
        self.xgboost = XGBoostModel()
        self.data_service = DataService()

    async def predict(
        self,
        crop_id: str,
        mandi_id: str,
        planting_date: date,
        harvest_date: date,
        historical_prices: pd.DataFrame,
        weather_risk_score: float,
        land_size_acres: float,
        total_input_cost_inr: float,
    ) -> dict[str, Any]:
        """
        Runs both models and blends their outputs.
        Returns: price_low_kg, price_high_kg, price_median_kg, confidence,
                 demand_trend, yield_est_tons_acre
        """
        # ── Prophet prediction (seasonal baseline) ─────────────
        prophet_result = self.prophet.predict(
            crop_id=crop_id,
            mandi_id=mandi_id,
            target_date=harvest_date,
            historical_prices=historical_prices,
        )
        prophet_price = prophet_result["predicted_price"]
        prophet_lower = prophet_result["lower_bound"]
        prophet_upper = prophet_result["upper_bound"]

        # ── XGBoost prediction (market adjustment) ──────────────
        feature_df = self.data_service.build_feature_vector(
            harvest_date=harvest_date,
            historical_prices=historical_prices,
            weather_risk_score=weather_risk_score,
            land_size_acres=land_size_acres,
            total_input_cost_inr=total_input_cost_inr,
        )
        xgboost_price = self.xgboost.predict(feature_df)

        # ── Weighted blend ──────────────────────────────────────
        blended_median = (
            self.PROPHET_WEIGHT * prophet_price +
            self.XGBOOST_WEIGHT * xgboost_price
        )

        # Apply weather risk penalty to yield and price
        weather_penalty = max(0.8, 1.0 - weather_risk_score * 0.3)
        blended_median *= weather_penalty

        # Derive range from Prophet uncertainty (scaled to confidence)
        spread = (prophet_upper - prophet_lower) * 0.5
        price_low = max(1.0, blended_median - spread * 0.8)
        price_high = blended_median + spread * 0.8
        price_median = blended_median

        # ── Confidence score ────────────────────────────────────
        # Based on: data quantity, model agreement, weather certainty
        data_factor = min(1.0, len(historical_prices) / 365)
        model_agreement = 1.0 - min(1.0, abs(prophet_price - xgboost_price) / (prophet_price + 1e-9))
        weather_factor = 1.0 - weather_risk_score * 0.5
        confidence = round(data_factor * 0.3 + model_agreement * 0.5 + weather_factor * 0.2, 4)
        confidence = max(0.3, min(0.95, confidence))

        # ── Demand trend ────────────────────────────────────────
        demand_trend = self._assess_demand_trend(historical_prices, harvest_date)

        # ── Yield estimate ──────────────────────────────────────
        yield_est = self.DEFAULT_YIELD_TONS_ACRE * weather_penalty

        logger.debug(
            f"Ensemble: Prophet={prophet_price:.2f}, XGB={xgboost_price:.2f}, "
            f"Blended={price_median:.2f}, Confidence={confidence:.3f}"
        )

        return {
            "price_low_kg": round(price_low, 4),
            "price_high_kg": round(price_high, 4),
            "price_median_kg": round(price_median, 4),
            "confidence": confidence,
            "demand_trend": demand_trend,
            "yield_est_tons_acre": round(yield_est, 2),
        }

    def _assess_demand_trend(
        self, historical_prices: pd.DataFrame, harvest_date: date
    ) -> str:
        """
        Estimates the demand trend based on recent price momentum.
        High momentum → HIGH demand; declining prices → DECLINING.
        """
        if len(historical_prices) < 14:
            return "MODERATE"

        recent_7d = historical_prices["y"].tail(7).mean()
        prior_7d = historical_prices["y"].tail(14).head(7).mean()

        if prior_7d == 0:
            return "MODERATE"

        momentum = (recent_7d - prior_7d) / prior_7d

        if momentum > 0.10:
            return "HIGH"
        if momentum > 0.03:
            return "MODERATE"
        if momentum < -0.10:
            return "DECLINING"
        return "LOW"
