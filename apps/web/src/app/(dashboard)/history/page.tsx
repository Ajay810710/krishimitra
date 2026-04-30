'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatPricePerKg, timeAgo } from '@krishimitra/shared';

interface Prediction {
  id: string;
  crop: { name: string; nameHindi: string | null };
  mandi: { name: string; district: string };
  priceMedianKg: number | null;
  recommendation: string | null;
  status: string;
  createdAt: string;
}

const REC: Record<string, { bg: string; text: string; label: string }> = {
  PLANT:                { bg: 'bg-green-100', text: 'text-green-700', label: 'बोएं' },
  WAIT:                 { bg: 'bg-amber-100', text: 'text-amber-700', label: 'प्रतीक्षा' },
  CONSIDER_ALTERNATIVES:{ bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'विकल्प' },
};

export default function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['prediction-history-all'],
    queryFn: () => apiClient.get('/farmer/history?limit=50').then((r) => r.data),
  });

  const predictions: Prediction[] = data?.predictions ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">पूर्वानुमान इतिहास</h1>
        <p className="mt-1 text-sm text-gray-500">आपके सभी पुराने मूल्य पूर्वानुमान</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && predictions.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-medium text-gray-500">अभी कोई पूर्वानुमान नहीं</p>
          <Link href="/forecast" className="btn-primary mt-4">पहला पूर्वानुमान पाएं</Link>
        </div>
      )}

      <div className="space-y-2">
        {predictions.map((pred) => {
          const rec = pred.recommendation ? (REC[pred.recommendation] ?? null) : null;
          return (
            <div key={pred.id}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-krishna-50 text-xl">🌾</div>
                <div>
                  <p className="font-semibold text-gray-800">{pred.crop.nameHindi ?? pred.crop.name}</p>
                  <p className="text-xs text-gray-400">{pred.mandi.name} · {timeAgo(pred.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {pred.priceMedianKg != null && (
                  <p className="font-bold text-krishna-700">{formatPricePerKg(pred.priceMedianKg)}</p>
                )}
                {rec && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${rec.bg} ${rec.text}`}>
                    {rec.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
