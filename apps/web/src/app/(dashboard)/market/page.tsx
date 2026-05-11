'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import { apiClient } from '@/lib/api-client';
import { MandiPriceTable } from '@/components/market/MandiPriceTable';
import { MandiSelector } from '@/components/market/MandiSelector';
import { formatDate } from '@krishimitra/shared';
import type { Crop, Mandi, MandiPrice } from '@krishimitra/shared';

export default function MarketPage() {
  const [selectedCropId, setSelectedCropId]   = useState('');
  const [selectedMandiId, setSelectedMandiId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  const { data: cropsData } = useQuery({
    queryKey: ['crops'],
    queryFn: () => apiClient.get('/market/crops').then((r) => r.data.data as Crop[]),
    staleTime: 1000 * 60 * 60,
  });

  const { data: mandisData } = useQuery({
    queryKey: ['mandis'],
    queryFn: () => apiClient.get('/market/mandis').then((r) => r.data.data as Mandi[]),
    staleTime: 1000 * 60 * 60,
  });

  const { data: pricesData, isLoading: pricesLoading } = useQuery({
    queryKey: ['market-prices', selectedCropId, selectedMandiId, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '90' });
      if (startDate) params.set('startDate', startDate);
      if (endDate)   params.set('endDate', endDate);
      return apiClient
        .get(`/market/prices/${selectedCropId}/${selectedMandiId}?${params}`)
        .then((r) => r.data.data as MandiPrice[]);
    },
    enabled: !!selectedCropId && !!selectedMandiId,
  });

  /* Build chart data from price records (newest-last for left-to-right trend) */
  const chartData = (pricesData ?? [])
    .slice()
    .reverse()
    .map((p) => ({
      date: formatDate(p.priceDate).slice(0, 6),
      min:  Number(Number(p.minPriceKg).toFixed(2)),
      mode: Number(Number(p.modalPriceKg).toFixed(2)),
      max:  Number(Number(p.maxPriceKg).toFixed(2)),
    }));

  const latestPrice = pricesData?.[0];
  const prevPrice   = pricesData?.[1];
  const priceDiff   = latestPrice && prevPrice
    ? Number(latestPrice.modalPriceKg) - Number(prevPrice.modalPriceKg)
    : null;
  const priceUp = priceDiff !== null && priceDiff >= 0;

  const cropName = cropsData?.find((c) => c.id === selectedCropId);
  const mandiName = mandisData?.find((m) => m.id === selectedMandiId);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">बाजार भाव</h1>
        <p className="mt-1 text-sm text-gray-500">किसी भी मंडी में किसी भी फसल का भाव देखें</p>
      </div>

      {/* ── Filter controls ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">फसल चुनें</label>
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
          >
            <option value="">-- फसल चुनें --</option>
            {(cropsData ?? []).map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.nameHindi ?? crop.name} ({crop.name})
              </option>
            ))}
          </select>
        </div>

        <MandiSelector
          mandis={mandisData ?? []}
          selectedMandiId={selectedMandiId}
          onSelect={setSelectedMandiId}
        />

        {selectedCropId && selectedMandiId && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">शुरुआत तारीख</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">अंतिम तारीख</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
              />
            </div>
          </>
        )}
      </div>

      {selectedCropId && selectedMandiId ? (
        <>
          {/* ── Summary stats ── */}
          {latestPrice && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'न्यूनतम', value: `₹${Number(latestPrice.minPriceKg).toFixed(1)}/kg`, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'मध्य भाव', value: `₹${Number(latestPrice.modalPriceKg).toFixed(1)}/kg`, color: 'text-krishna-700', bg: 'bg-krishna-50' },
                { label: 'अधिकतम', value: `₹${Number(latestPrice.maxPriceKg).toFixed(1)}/kg`, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl ${s.bg} p-4 text-center shadow-sm`}>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Price trend chart ── */}
          {chartData.length > 1 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-krishna-600" />
                  <h2 className="font-semibold text-gray-800">मूल्य ट्रेंड</h2>
                  {cropName && mandiName && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {cropName.nameHindi ?? cropName.name} · {mandiName.name}
                    </span>
                  )}
                </div>
                {priceDiff !== null && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${priceUp ? 'text-green-600' : 'text-red-500'}`}>
                    {priceUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {priceUp ? '+' : ''}{priceDiff.toFixed(2)}/kg
                  </div>
                )}
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="maxGrad"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="modeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="₹" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(v: number, name: string) => [`₹${v}/kg`, name === 'max' ? 'अधिकतम' : name === 'mode' ? 'मध्य' : 'न्यूनतम']}
                  />
                  <Legend formatter={(v) => v === 'max' ? 'अधिकतम' : v === 'mode' ? 'मध्य' : 'न्यूनतम'} iconType="circle" iconSize={8} />
                  <Area type="monotone" dataKey="max"  stroke="#16a34a" strokeWidth={2} fill="url(#maxGrad)"  dot={false} />
                  <Area type="monotone" dataKey="mode" stroke="#2563eb" strokeWidth={2} fill="url(#modeGrad)" dot={false} />
                  <Area type="monotone" dataKey="min"  stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Price table ── */}
          <MandiPriceTable prices={pricesData ?? []} isLoading={pricesLoading} />
        </>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-krishna-50">
            <BarChart3 className="h-8 w-8 text-krishna-400" />
          </div>
          <p className="font-medium text-gray-600">ऊपर से फसल और मंडी चुनें</p>
          <p className="mt-1 text-sm text-gray-400">चुनाव करने पर मूल्य चार्ट और डेटा दिखेगा</p>
        </div>
      )}
    </div>
  );
}
