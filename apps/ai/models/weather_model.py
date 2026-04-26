"""
WeatherModel — fetches weather forecasts and computes agricultural risk scores.
Uses the Open-Meteo API (free, no API key required) for weather data.
"""

import os
from datetime import date, timedelta
from typing import Any

import httpx
from loguru import logger


class WeatherModel:
    """
    Fetches forecast data from Open-Meteo and converts it into a risk score
    that the ensemble model uses to adjust price predictions.
    """

    OPEN_METEO_BASE_URL = os.getenv(
        "OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1"
    )
    REQUEST_TIMEOUT_SECONDS = 10

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        target_date: date,
    ) -> dict[str, Any]:
        """
        Fetches weather forecast for the harvest period and computes a risk score.

        Returns:
            dict with keys: risk_score (0–1), risk_level (LOW/MODERATE/HIGH/CRITICAL),
            yield_adjustment (multiplier), summary (human-readable string)
        """
        forecast_days = min(16, max(7, (target_date - date.today()).days))

        try:
            async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.get(
                    f"{self.OPEN_METEO_BASE_URL}/forecast",
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max",
                        "timezone": "Asia/Kolkata",
                        "forecast_days": forecast_days,
                    },
                )
                response.raise_for_status()
                data = response.json()

                return self._calculate_risk(data)

        except httpx.TimeoutException:
            logger.warning(f"Weather API timeout for ({latitude}, {longitude}) — using default risk")
            return self._default_risk()
        except Exception as exc:
            logger.warning(f"Weather API error: {exc} — using default risk")
            return self._default_risk()

    def _calculate_risk(self, forecast_data: dict[str, Any]) -> dict[str, Any]:
        """
        Calculates agricultural risk from weather forecast data.
        Considers: excess rainfall, drought, extreme temperatures, high winds.
        """
        daily = forecast_data.get("daily", {})
        precipitation = daily.get("precipitation_sum", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        wind_speed = daily.get("windspeed_10m_max", [])

        risk_factors = []

        if precipitation:
            total_rainfall = sum(p for p in precipitation if p is not None)
            if total_rainfall > 150:
                risk_factors.append(0.6)  # Excess rainfall — flood/disease risk
            elif total_rainfall < 5:
                risk_factors.append(0.4)  # Drought risk
            else:
                risk_factors.append(0.1)

        if temp_max:
            max_temp = max(t for t in temp_max if t is not None)
            if max_temp > 42:
                risk_factors.append(0.7)  # Heat stress
            elif max_temp > 38:
                risk_factors.append(0.3)
            else:
                risk_factors.append(0.05)

        if wind_speed:
            max_wind = max(w for w in wind_speed if w is not None)
            if max_wind > 60:
                risk_factors.append(0.5)  # Cyclone/storm risk
            elif max_wind > 40:
                risk_factors.append(0.2)
            else:
                risk_factors.append(0.05)

        risk_score = min(1.0, sum(risk_factors) / max(len(risk_factors), 1))

        risk_level = (
            "CRITICAL" if risk_score > 0.7
            else "HIGH" if risk_score > 0.45
            else "MODERATE" if risk_score > 0.25
            else "LOW"
        )

        yield_adjustment = max(0.5, 1.0 - risk_score * 0.5)

        return {
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "yield_adjustment": round(yield_adjustment, 3),
            "summary": f"Weather risk is {risk_level.lower()} for the forecast period",
        }

    def _default_risk(self) -> dict[str, Any]:
        """Returns a moderate risk estimate when weather data is unavailable."""
        return {
            "risk_score": 0.25,
            "risk_level": "MODERATE",
            "yield_adjustment": 0.85,
            "summary": "Weather data unavailable — using moderate risk assumption",
        }
