import { Injectable, Logger } from '@nestjs/common';

const OPEN_METEO = 'https://api.open-meteo.com/v1';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  async getForecast(lat: number, lng: number) {
    try {
      const url = `${OPEN_METEO}/forecast?latitude=${lat}&longitude=${lng}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode` +
        `&current_weather=true&timezone=Asia%2FKolkata&forecast_days=7`;

      const res  = await fetch(url);
      const data = await res.json() as any;

      const days = (data.daily.time as string[]).map((date: string, i: number) => ({
        date,
        maxTemp:       data.daily.temperature_2m_max[i],
        minTemp:       data.daily.temperature_2m_min[i],
        rainfall:      data.daily.precipitation_sum[i],
        maxWindSpeed:  data.daily.windspeed_10m_max[i],
        weatherCode:   data.daily.weathercode[i],
        icon:          this.codeToIcon(data.daily.weathercode[i]),
        description:   this.codeToDesc(data.daily.weathercode[i]),
        descriptionHi: this.codeToDescHi(data.daily.weathercode[i]),
      }));

      return {
        data: {
          current: {
            temp:        data.current_weather.temperature,
            windSpeed:   data.current_weather.windspeed,
            weatherCode: data.current_weather.weathercode,
            icon:        this.codeToIcon(data.current_weather.weathercode),
            description: this.codeToDesc(data.current_weather.weathercode),
            descriptionHi: this.codeToDescHi(data.current_weather.weathercode),
          },
          forecast: days,
          location: { lat, lng },
        },
      };
    } catch (err) {
      this.logger.warn('Weather API failed, returning fallback');
      return { data: null, error: 'Weather data temporarily unavailable' };
    }
  }

  async getRisk(lat: number, lng: number) {
    const forecast = await this.getForecast(lat, lng);
    if (!forecast.data) return { data: { risks: [] } };

    const { forecast: days } = forecast.data;
    const risks: { type: string; severity: string; message: string; messageHi: string; date: string }[] = [];

    for (const day of days) {
      if (day.rainfall > 50) {
        risks.push({ type: 'HEAVY_RAIN', severity: 'HIGH',
          message: `Heavy rainfall expected (${day.rainfall}mm) on ${day.date}`,
          messageHi: `${day.date} को भारी बारिश की संभावना (${day.rainfall}mm)`,
          date: day.date });
      } else if (day.rainfall > 20) {
        risks.push({ type: 'MODERATE_RAIN', severity: 'MEDIUM',
          message: `Moderate rain (${day.rainfall}mm) on ${day.date}`,
          messageHi: `${day.date} को मध्यम बारिश (${day.rainfall}mm)`,
          date: day.date });
      }
      if (day.maxTemp > 42) {
        risks.push({ type: 'HEAT_STRESS', severity: 'HIGH',
          message: `Extreme heat (${day.maxTemp}°C) on ${day.date} — avoid spraying`,
          messageHi: `${day.date} को अत्यधिक गर्मी (${day.maxTemp}°C) — छिड़काव से बचें`,
          date: day.date });
      }
      if (day.minTemp < 5) {
        risks.push({ type: 'FROST_RISK', severity: 'HIGH',
          message: `Frost risk (${day.minTemp}°C) on ${day.date} — protect sensitive crops`,
          messageHi: `${day.date} को पाले का खतरा (${day.minTemp}°C) — नाजुक फसलों की रक्षा करें`,
          date: day.date });
      }
      if (day.maxWindSpeed > 50) {
        risks.push({ type: 'STRONG_WIND', severity: 'MEDIUM',
          message: `Strong winds (${day.maxWindSpeed}km/h) on ${day.date}`,
          messageHi: `${day.date} को तेज हवाएं (${day.maxWindSpeed}km/h)`,
          date: day.date });
      }
    }

    const overallRisk = risks.some((r) => r.severity === 'HIGH')
      ? 'HIGH' : risks.length > 0 ? 'MEDIUM' : 'LOW';

    return { data: { risks, overallRisk, forecastDays: days.length } };
  }

  private codeToIcon(code: number): string {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌦️';
    if (code <= 99) return '⛈️';
    return '🌤️';
  }

  private codeToDesc(code: number): string {
    if (code === 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 49) return 'Foggy';
    if (code <= 59) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Cloudy';
  }

  private codeToDescHi(code: number): string {
    if (code === 0) return 'साफ आसमान';
    if (code <= 3) return 'आंशिक बादल';
    if (code <= 49) return 'कोहरा';
    if (code <= 59) return 'बूंदाबांदी';
    if (code <= 67) return 'बारिश';
    if (code <= 77) return 'बर्फबारी';
    if (code <= 82) return 'बौछारें';
    if (code <= 99) return 'आंधी-तूफान';
    return 'बादल';
  }
}
