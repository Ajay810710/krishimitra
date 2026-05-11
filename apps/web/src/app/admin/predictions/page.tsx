'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createAdminClient, getAdminKey } from '@/lib/admin-client';

interface Prediction {
  id: string; status: string; recommendation: string | null;
  priceMedianKg: number | null; confidenceScore: number | null;
  profitLowInr: number | null; profitHighInr: number | null;
  landSizeAcres: number; createdAt: string;
  farmer: { name: string; phone: string };
  crop:   { name: string; nameHindi: string | null };
  mandi:  { name: string };
}

const REC_STYLE: Record<string, string> = {
  PLANT:                 'bg-green-100 text-green-700',
  WAIT:                  'bg-amber-100 text-amber-700',
  CONSIDER_ALTERNATIVES: 'bg-blue-100 text-blue-700',
};
const REC_LABEL: Record<string, string> = {
  PLANT: 'Plant', WAIT: 'Wait', CONSIDER_ALTERNATIVES: 'Alternative',
};

export default function AdminPredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await createAdminClient(getAdminKey()).get(`/predictions?page=${p}&limit=20`);
      setPredictions(res.data.data.predictions);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Predictions</h1>
        <p className="text-sm text-gray-500">{total} total price forecasts</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              {['Farmer', 'Crop', 'Mandi', 'Price/kg', 'Profit Range', 'Confidence', 'Rec', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(8).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100" /></td>
                  ))}
                </tr>
              ))
            ) : predictions.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.farmer.name}</p>
                  <p className="text-xs text-gray-400">{p.farmer.phone}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{p.crop.nameHindi ?? p.crop.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.mandi.name}</td>
                <td className="px-4 py-3 font-semibold text-krishna-700">
                  {p.priceMedianKg ? `₹${Number(p.priceMedianKg).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.profitLowInr !== null && p.profitHighInr !== null
                    ? `₹${Math.round(p.profitLowInr / 1000)}k – ₹${Math.round(p.profitHighInr / 1000)}k`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {p.confidenceScore ? `${(p.confidenceScore * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="px-4 py-3">
                  {p.recommendation ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REC_STYLE[p.recommendation] ?? 'bg-gray-100 text-gray-600'}`}>
                      {REC_LABEL[p.recommendation] ?? p.recommendation}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
