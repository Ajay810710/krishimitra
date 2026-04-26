/**
 * Crop recommendation page — AI-powered crop suggestions based on market conditions.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Leaf } from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { formatINR, formatPricePerKg } from '@krishimitra/shared';
import { useAuthStore } from '@/stores/auth.store';

interface RecommendationItem {
  crop_id: string;
  crop_name: string;
  crop_name_hindi: string;
  score: number;
  expected_price_kg: number;
  expected_profit_inr: number;
  recommendation: 'PLANT' | 'WAIT' | 'CONSIDER_ALTERNATIVES';
  reason: string;
}

export default function RecommendPage() {
  const { farmer } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => apiClient.get('/predict/recommend').then((r) => r.data.data),
  });

  const recommendations: RecommendationItem[] = data?.recommendations ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">फसल सलाह</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI द्वारा आपकी मंडी के लिए सर्वोत्तम फसलों की सिफारिश
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
          <Leaf className="mx-auto mb-3 h-8 w-8 text-amber-400" />
          <p className="font-medium text-amber-800">मंडी सेट नहीं है</p>
          <p className="mt-1 text-sm text-amber-700">सिफारिश पाने के लिए अपनी नज़दीकी मंडी प्रोफ़ाइल में सेट करें।</p>
          <div className="mt-3 flex justify-center gap-3">
            <a href="/profile" className="rounded-lg bg-krishna-600 px-4 py-2 text-sm font-medium text-white hover:bg-krishna-700">
              प्रोफ़ाइल खोलें
            </a>
            <button onClick={() => refetch()} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              पुनः प्रयास करें
            </button>
          </div>
        </div>
      )}

      {!isLoading && recommendations.length === 0 && !isError && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Leaf className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-gray-400">सिफारिश के लिए अपनी मंडी प्रोफ़ाइल में सेट करें</p>
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={rec.crop_id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-krishna-50 text-lg font-bold text-krishna-600">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{rec.crop_name_hindi}</p>
                  <p className="text-sm text-gray-500">{rec.crop_name}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  rec.recommendation === 'PLANT'
                    ? 'bg-krishna-100 text-krishna-700'
                    : rec.recommendation === 'WAIT'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {rec.recommendation === 'PLANT' ? 'बोएं' : rec.recommendation === 'WAIT' ? 'प्रतीक्षा' : 'विकल्प'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-gray-400">अपेक्षित भाव</p>
                <p className="font-semibold text-krishna-700">{formatPricePerKg(rec.expected_price_kg)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-xs text-gray-400">अपेक्षित मुनाफा</p>
                <p className="font-semibold text-gray-800">{formatINR(rec.expected_profit_inr)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-krishna-500"
                  style={{ width: `${Math.round(rec.score * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {Math.round(rec.score * 100)}% स्कोर
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">{rec.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
