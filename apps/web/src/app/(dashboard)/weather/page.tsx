'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Cloud, CloudRain, Droplets, Thermometer, Wind } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface DayForecast {
  date: string;
  icon: string;
  description: string;
  descriptionHi: string;
  maxTemp: number;
  minTemp: number;
  rainfall: number;
  maxWindSpeed: number;
}

interface CurrentWeather {
  temp: number;
  windSpeed: number;
  icon: string;
  description: string;
  descriptionHi: string;
}

interface ForecastData {
  current: CurrentWeather;
  forecast: DayForecast[];
}

interface RiskFactor {
  type: string;
  severity: string;
  message: string;
  messageHi: string;
  date: string;
}

interface RiskData {
  overallRisk: string;
  risks: RiskFactor[];
  forecastDays: number;
}

function riskStyle(level: string) {
  if (level === 'LOW') return { banner: 'bg-green-50 border-green-200 text-green-800', badge: 'bg-green-100 text-green-700', label: 'कम' };
  if (level === 'MEDIUM') return { banner: 'bg-amber-50 border-amber-200 text-amber-800', badge: 'bg-amber-100 text-amber-700', label: 'मध्यम' };
  return { banner: 'bg-red-50 border-red-200 text-red-800', badge: 'bg-red-100 text-red-700', label: 'अधिक' };
}

export default function WeatherPage() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
        () => {},
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/weather/forecast?lat=${lat}&lng=${lng}`).then((r) => r.json()),
      fetch(`${API}/weather/risk?lat=${lat}&lng=${lng}`).then((r) => r.json()),
    ])
      .then(([f, r]) => { setForecast(f.data); setRisk(r.data); })
      .catch(() => setError('मौसम डेटा लोड करने में समस्या हुई।'))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Cloud className="h-10 w-10 text-krishna-400 animate-pulse mx-auto mb-2" />
          <p className="text-gray-500 text-sm">मौसम डेटा लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{error}</div>;
  }

  const style = risk ? riskStyle(risk.overallRisk) : riskStyle('LOW');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">मौसम पूर्वानुमान</h1>
        <p className="text-sm text-gray-500 mt-0.5">7-दिवसीय मौसम जानकारी और कृषि जोखिम विश्लेषण</p>
      </div>

      {/* Current weather */}
      {forecast?.current && (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-sky-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">अभी का मौसम</p>
              <p className="text-4xl font-bold text-gray-900">{Math.round(forecast.current.temp)}°C</p>
              <p className="text-base text-gray-600 mt-1">{forecast.current.descriptionHi}</p>
            </div>
            <div className="text-6xl">{forecast.current.icon}</div>
          </div>
          <div className="mt-4 flex gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Wind className="h-4 w-4" />{Math.round(forecast.current.windSpeed)} km/h</span>
          </div>
        </div>
      )}

      {/* Risk Banner */}
      {risk && (
        <div className={`rounded-xl border p-4 ${style.banner}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold text-base">कृषि जोखिम: {style.label}</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
              {risk.overallRisk}
            </span>
          </div>
          {risk.risks.length > 0 ? (
            <ul className="space-y-1 mt-2">
              {risk.risks.slice(0, 4).map((f, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">•</span>
                  <span>{f.messageHi}</span>
                </li>
              ))}
              {risk.risks.length > 4 && (
                <li className="text-xs opacity-70">...और {risk.risks.length - 4} चेतावनियां</li>
              )}
            </ul>
          ) : (
            <p className="text-sm mt-1">कोई महत्वपूर्ण मौसम जोखिम नहीं है।</p>
          )}
        </div>
      )}

      {/* 7-day forecast */}
      {forecast?.forecast && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">7 दिनों का पूर्वानुमान</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {forecast.forecast.map((day, i) => {
              const date = new Date(day.date);
              const weekday = date.toLocaleDateString('hi-IN', { weekday: 'short' });
              const dateStr = date.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
              return (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-gray-500">{weekday}</p>
                  <p className="text-[10px] text-gray-400 mb-2">{dateStr}</p>
                  <div className="text-3xl mb-1">{day.icon}</div>
                  <p className="text-[10px] text-gray-500 mb-2 leading-tight">{day.descriptionHi}</p>
                  <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                    <span className="text-red-500">{Math.round(day.maxTemp)}°</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-blue-500">{Math.round(day.minTemp)}°</span>
                  </div>
                  {day.rainfall > 0 && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-blue-600">
                      <Droplets className="h-3 w-3" />
                      {day.rainfall.toFixed(1)} mm
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today details */}
      {forecast?.forecast?.[0] && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">आज का विस्तृत विवरण</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: <Thermometer className="h-5 w-5 text-red-400" />, label: 'तापमान', value: `${Math.round(forecast.forecast[0].minTemp)}°–${Math.round(forecast.forecast[0].maxTemp)}°C` },
              { icon: <CloudRain className="h-5 w-5 text-blue-400" />, label: 'वर्षा', value: `${forecast.forecast[0].rainfall.toFixed(1)} mm` },
              { icon: <Wind className="h-5 w-5 text-gray-400" />, label: 'हवा', value: `${Math.round(forecast.forecast[0].maxWindSpeed)} km/h` },
              { icon: <Droplets className="h-5 w-5 text-blue-300" />, label: 'मौसम', value: forecast.forecast[0].descriptionHi },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                {item.icon}
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        डेटा: Open-Meteo (open-meteo.com) • स्थान: {lat.toFixed(2)}°N, {lng.toFixed(2)}°E
      </p>
    </div>
  );
}
