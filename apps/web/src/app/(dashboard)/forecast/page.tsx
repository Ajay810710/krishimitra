'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrendingUp, Leaf, AlertTriangle, CheckCircle } from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { formatPricePerKg, formatINR } from '@krishimitra/shared';

const schema = z.object({
  cropId:       z.string().min(1, 'फसल चुनें'),
  mandiId:      z.string().min(1, 'मंडी चुनें'),
  plantingDate: z.string().min(1, 'बुवाई की तारीख दर्ज करें'),
  harvestDate:  z.string().min(1, 'कटाई की तारीख दर्ज करें'),
  landSizeAcres: z.coerce.number().min(0.1, 'न्यूनतम 0.1 एकड़'),
  seedCostInr:       z.coerce.number().min(0),
  fertilizerCostInr: z.coerce.number().min(0),
  labourCostInr:     z.coerce.number().min(0),
  irrigationCostInr: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

const REC_CONFIG = {
  PLANT:                { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  icon: CheckCircle,     label: 'अभी बोएं' },
  WAIT:                 { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: AlertTriangle,   label: 'प्रतीक्षा करें' },
  CONSIDER_ALTERNATIVES:{ bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: Leaf,            label: 'विकल्प सोचें' },
};

export default function ForecastPage() {
  const { farmer } = useAuthStore();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const { data: crops = [] } = useQuery({
    queryKey: ['crops'],
    queryFn: () => apiClient.get('/market/crops').then((r) => r.data.data ?? []),
    staleTime: 1000 * 60 * 60,
  });

  const { data: mandis = [] } = useQuery({
    queryKey: ['mandis'],
    queryFn: () => apiClient.get('/market/mandis').then((r) => r.data.data ?? []),
    staleTime: 1000 * 60 * 60,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { seedCostInr: 0, fertilizerCostInr: 0, labourCostInr: 0, irrigationCostInr: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.post('/predict/price', {
        cropId: data.cropId,
        mandiId: data.mandiId,
        plantingDate: data.plantingDate,
        harvestDate: data.harvestDate,
        landSizeAcres: data.landSizeAcres,
        inputCosts: {
          seedCostInr:       data.seedCostInr,
          fertilizerCostInr: data.fertilizerCostInr,
          labourCostInr:     data.labourCostInr,
          irrigationCostInr: data.irrigationCostInr,
        },
      }).then((r) => r.data),
    onSuccess: (data) => setResult(data),
  });

  const rec = result
    ? REC_CONFIG[(result.recommendation as keyof typeof REC_CONFIG) ?? 'WAIT'] ?? REC_CONFIG.WAIT
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">मूल्य पूर्वानुमान</h1>
        <p className="mt-1 text-sm text-gray-500">फसल की जानकारी भरें — AI आपको सही बाजार भाव बताएगा</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          {/* Crop + Mandi */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">फसल *</label>
              <select {...register('cropId')}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100">
                <option value="">-- फसल चुनें --</option>
                {(crops as {id:string;name:string;nameHindi:string|null}[]).map((c) => (
                  <option key={c.id} value={c.id}>{c.nameHindi ?? c.name}</option>
                ))}
              </select>
              {errors.cropId && <p className="mt-1 text-xs text-red-600">{errors.cropId.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">मंडी *</label>
              <select {...register('mandiId')}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100">
                <option value="">-- मंडी चुनें --</option>
                {(mandis as {id:string;name:string;district:string}[]).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.district})</option>
                ))}
              </select>
              {errors.mandiId && <p className="mt-1 text-xs text-red-600">{errors.mandiId.message}</p>}
            </div>
          </div>

          {/* Dates + Land */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { name: 'plantingDate' as const, label: 'बुवाई की तारीख *' },
              { name: 'harvestDate'  as const, label: 'कटाई की तारीख *'  },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
                <input type="date" {...register(name)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100" />
                {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]?.message}</p>}
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">जमीन (एकड़) *</label>
              <input type="number" step="0.1" min="0.1" {...register('landSizeAcres')}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100" />
              {errors.landSizeAcres && <p className="mt-1 text-xs text-red-600">{errors.landSizeAcres.message}</p>}
            </div>
          </div>

          {/* Input costs */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-800">लागत (वैकल्पिक)</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { name: 'seedCostInr'       as const, label: 'बीज लागत'    },
                { name: 'fertilizerCostInr' as const, label: 'खाद लागत'    },
                { name: 'labourCostInr'     as const, label: 'मजदूरी'      },
                { name: 'irrigationCostInr' as const, label: 'सिंचाई लागत' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{label} (₹)</label>
                  <input type="number" min="0" {...register(name)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-krishna-500 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>

          {mutation.isError && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {mutation.error instanceof Error ? mutation.error.message : 'कुछ गलत हुआ। पुनः प्रयास करें।'}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending}
            className="btn-primary w-full py-3.5 text-base">
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                AI विश्लेषण कर रहा है...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" /> मूल्य पूर्वानुमान पाएं
              </span>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-up">
          {/* Recommendation banner */}
          {rec && (
            <div className={`rounded-2xl border p-5 ${rec.bg} ${rec.border}`}>
              <div className="flex items-center gap-3">
                <rec.icon className={`h-8 w-8 ${rec.text}`} />
                <div>
                  <p className={`text-lg font-bold ${rec.text}`}>{rec.label}</p>
                  <p className="text-sm text-gray-600">{String(result.recommendationTextHi ?? result.recommendationText ?? '')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'न्यूनतम भाव', value: result.priceLowKg  as number, color: 'text-orange-600' },
              { label: 'मध्य भाव',    value: result.priceMedianKg as number, color: 'text-krishna-700' },
              { label: 'अधिकतम भाव', value: result.priceHighKg as number, color: 'text-green-600'  },
            ].map((p) => (
              <div key={p.label} className="metric-card text-center">
                <p className="text-xs text-gray-500">{p.label}</p>
                <p className={`mt-1 text-xl font-bold ${p.color}`}>
                  {p.value != null ? formatPricePerKg(p.value) : '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Profit */}
          {result.profitLowInr != null && (
            <div className="metric-card">
              <p className="text-sm font-medium text-gray-600">अनुमानित मुनाफा</p>
              <p className="mt-1 text-xl font-bold text-krishna-700">
                {formatINR(result.profitLowInr as number)} – {formatINR(result.profitHighInr as number)}
              </p>
            </div>
          )}

          <button onClick={() => setResult(null)} className="btn-primary w-full">
            नया पूर्वानुमान लें
          </button>
        </div>
      )}
    </div>
  );
}
