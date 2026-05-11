'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertCircle, ArrowRight, BarChart3, Leaf, TrendingUp,
  TrendingDown, Zap, Bell, Activity, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { formatPricePerKg, timeAgo } from '@krishimitra/shared';

const WEEK = ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'];

interface Prediction {
  id: string;
  crop: { name: string; nameHindi: string | null };
  mandi: { name: string };
  priceMedianKg: string | null;
  recommendation: string | null;
  createdAt: string;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const REC: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PLANT:   { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'बोएं' },
  WAIT:    { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400',  label: 'प्रतीक्षा' },
  DEFAULT: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400',   label: 'विकल्प सोचें' },
};

function Spark({ data, color }: { data: { i: number; v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2}
              fill={`url(#sg-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { farmer } = useAuthStore();

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['prediction-history'],
    queryFn: () => apiClient.get('/farmer/history?limit=5').then((r) => r.data),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/alerts?limit=3').then((r) => r.data),
  });

  // Fetch top market price trend (Tomato as a common indicator crop)
  const { data: cropsData } = useQuery({
    queryKey: ['crops'],
    queryFn: () => apiClient.get('/market/crops').then((r) => r.data.data),
    staleTime: 1000 * 60 * 60,
  });

  const { data: mandisData } = useQuery({
    queryKey: ['mandis'],
    queryFn: () => apiClient.get('/market/mandis').then((r) => r.data.data),
    staleTime: 1000 * 60 * 60,
  });

  // Pick first available crop + mandi for the market pulse chart
  const firstCrop  = cropsData?.[0];
  const firstMandi = mandisData?.[0];

  const { data: marketPriceData } = useQuery({
    queryKey: ['market-pulse', firstCrop?.id, firstMandi?.id],
    queryFn: () =>
      apiClient.get(`/market/prices/${firstCrop.id}/${firstMandi.id}?limit=7`).then((r) => r.data.data),
    enabled: !!firstCrop?.id && !!firstMandi?.id,
    staleTime: 1000 * 60 * 30,
  });

  const predictions: Prediction[] = historyData?.predictions ?? [];
  const alerts: Alert[] = alertsData?.data?.alerts ?? [];
  const unreadCount: number = alertsData?.data?.unreadCount ?? 0;

  // Build real sparkline data from market prices (newest last)
  const sparkData: { i: number; v: number }[] = marketPriceData
    ? [...marketPriceData].reverse().map((p: any, i: number) => ({ i, v: Number(p.modalPriceKg) }))
    : [];

  const areaData = sparkData.map((d, i) => ({ day: WEEK[i % 7], price: d.v }));

  // Compute real price change
  const latestMktPrice = marketPriceData?.[0] ? Number(marketPriceData[0].modalPriceKg) : null;
  const prevMktPrice   = marketPriceData?.[1] ? Number(marketPriceData[1].modalPriceKg) : null;
  const priceDiff = latestMktPrice && prevMktPrice ? latestMktPrice - prevMktPrice : null;
  const pctChange = priceDiff && prevMktPrice ? ((priceDiff / prevMktPrice) * 100).toFixed(1) : null;
  const priceUp   = priceDiff !== null && priceDiff >= 0;

  return (
    <div className="space-y-6 pb-4">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-krishna-800 via-krishna-700 to-krishna-600 p-6 shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 right-20 h-36 w-36 rounded-full bg-mandi-400/10" />
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-krishna-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              लाइव बाजार अपडेट
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white">
              नमस्ते, {farmer?.name ?? 'किसान'} 👋
            </h1>
            <p className="mt-1 text-sm text-krishna-200">
              आज अपनी फसल का सही भाव जानें — बुवाई से पहले।
            </p>
          </div>
          <Link
            href="/forecast"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-krishna-700 shadow-md transition-all hover:shadow-lg hover:brightness-105 active:scale-95"
          >
            <Zap className="h-4 w-4 text-mandi-500" />
            मूल्य पूर्वानुमान पाएं
          </Link>
        </div>
      </div>

      {/* ── 3-column metric cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1 — Best Price Today */}
        <div className="animate-fade-up metric-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-krishna-50">
                <TrendingUp className="h-5 w-5 text-krishna-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">आज का बाजार भाव</p>
                <p className="text-[10px] text-gray-400">
                  {firstCrop ? (firstCrop.nameHindi ?? firstCrop.name) : '—'} · {firstMandi?.name ?? '—'}
                </p>
              </div>
            </div>
            {pctChange ? (
              <span className={priceUp ? 'badge-up' : 'badge-down'}>
                {priceUp ? '↑' : '↓'} {Math.abs(Number(pctChange))}%
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {latestMktPrice ? `₹${latestMktPrice.toFixed(1)}` : '—'}
              <span className="text-sm font-normal text-gray-400">/kg</span>
            </p>
          </div>
          {sparkData.length > 0 && <Spark data={sparkData} color="#16a34a" />}
        </div>

        {/* Card 2 — Market Trend */}
        <div className="animate-fade-up animate-delay-100 metric-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">बाजार ट्रेंड</p>
                <p className="text-[10px] text-gray-400">पिछले 7 दिन</p>
              </div>
            </div>
            {pctChange ? (
              <span className={priceUp ? 'badge-up' : 'badge-down'}>
                {priceUp ? '↑' : '↓'} {Math.abs(Number(pctChange))}%
              </span>
            ) : <span className="badge-neutral">डेटा नहीं</span>}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {prevMktPrice ? `₹${prevMktPrice.toFixed(1)}` : '—'}
              <span className="text-sm font-normal text-gray-400">/kg</span>
            </p>
            <p className="text-xs text-gray-400">
              {firstCrop ? (firstCrop.nameHindi ?? firstCrop.name) : '—'} · बाजार औसत
            </p>
          </div>
        </div>

        {/* Card 3 — Active Alerts */}
        <div className="animate-fade-up animate-delay-200 metric-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">सक्रिय अलर्ट</p>
                <p className="text-[10px] text-gray-400">मूल्य सूचनाएं</p>
              </div>
            </div>
            {unreadCount > 0
              ? <span className="badge-up">{unreadCount} नए</span>
              : <span className="badge-neutral">कोई नहीं</span>}
          </div>
          <p className="text-3xl font-bold text-gray-900">{unreadCount}</p>
          <Link href="/alerts" className="mt-auto flex items-center gap-1 text-xs font-medium text-krishna-600 hover:underline">
            अलर्ट देखें <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ── 7-day price area chart ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">साप्ताहिक बाजार पल्स</h2>
            <p className="text-xs text-gray-400">
              {firstCrop ? (firstCrop.nameHindi ?? firstCrop.name) : '—'} · पिछले 7 दिन का भाव
            </p>
          </div>
          {pctChange && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${priceUp ? 'text-green-600' : 'text-red-500'}`}>
              {priceUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {priceUp ? '+' : ''}{pctChange}%
            </div>
          )}
        </div>
        {areaData.length > 1 ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="₹" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.1)', fontSize: 13, padding: '8px 14px' }}
                formatter={(v: number) => [`₹${v}/kg`, 'भाव']}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2.5}
                    fill="url(#wg)" dot={false} activeDot={{ r: 5, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            मूल्य डेटा लोड हो रहा है...
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-800">त्वरित क्रियाएं</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              href: '/forecast',
              icon: TrendingUp,
              title: 'मूल्य पूर्वानुमान',
              sub: 'AI से जानें अगले सीजन का भाव',
              from: 'from-krishna-500',
              to: 'to-krishna-600',
            },
            {
              href: '/recommend',
              icon: Leaf,
              title: 'फसल सलाह',
              sub: 'कौन सी फसल बोएं — AI सलाह',
              from: 'from-emerald-500',
              to: 'to-green-600',
            },
            {
              href: '/market',
              icon: BarChart3,
              title: 'बाजार भाव',
              sub: 'लाइव मंडी प्राइस देखें',
              from: 'from-blue-500',
              to: 'to-blue-600',
            },
          ].map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className="animate-fade-up card-hover flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.from} ${a.to} shadow-md`}>
                <a.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-gray-800">{a.title}</p>
                <p className="truncate text-xs text-gray-400">{a.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent predictions ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">हाल के पूर्वानुमान</h2>
          <Link href="/history" className="flex items-center gap-0.5 text-xs font-medium text-krishna-600 hover:underline">
            सभी देखें <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}
          </div>
        ) : predictions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-krishna-50 text-3xl">🌱</div>
            <p className="font-medium text-gray-600">अभी कोई पूर्वानुमान नहीं</p>
            <p className="mt-1 text-sm text-gray-400">पहला पूर्वानुमान पाने के लिए नीचे क्लिक करें</p>
            <Link href="/forecast" className="btn-primary mt-4">
              पूर्वानुमान पाएं <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.map((pred, i) => {
              const rec = REC[pred.recommendation ?? ''] ?? REC.DEFAULT;
              return (
                <Link
                  key={pred.id}
                  href={`/forecast/${pred.id}`}
                  className="animate-fade-up card-hover flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-krishna-100 to-krishna-200 text-xl">
                      🌾
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {pred.crop.nameHindi ?? pred.crop.name}
                      </p>
                      <p className="text-xs text-gray-500">{pred.mandi.name} · {timeAgo(pred.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-krishna-700">
                      {pred.priceMedianKg
                        ? formatPricePerKg(Number(pred.priceMedianKg))
                        : <span className="text-gray-300">—</span>}
                    </p>
                    {pred.recommendation && (
                      <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${rec.bg} ${rec.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${rec.dot}`} />
                        {rec.label}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent alerts ── */}
      {alerts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              हाल के अलर्ट
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </h2>
            <Link href="/alerts" className="flex items-center gap-0.5 text-xs font-medium text-krishna-600 hover:underline">
              सभी देखें <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-2xl p-4 shadow-sm ring-1 ${
                  alert.isRead ? 'bg-white ring-gray-100' : 'bg-krishna-50 ring-krishna-200'
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm ${
                  alert.isRead ? 'bg-gray-100' : 'bg-krishna-100'
                }`}>
                  {alert.isRead ? '🔔' : '🔴'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
