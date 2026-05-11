'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getAdminKey } from '@/lib/admin-client';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function adminClient() {
  return axios.create({ baseURL: `${API_URL}/api`, headers: { 'x-admin-key': getAdminKey() } });
}

interface AnalyticsData {
  totalFarmers: number;
  newLast30d: number;
  withPredictions: number;
  engagementRate: string;
  avgPredictionsPerFarmer: string;
  byState: { state: string; count: number }[];
  byLanguage: { language: string; count: number }[];
  activeVsInactive: { active: number; inactive: number };
  registrationTrend: { date: string; count: number }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-farmer-analytics'],
    queryFn: () => adminClient().get('/admin/analytics/farmers').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="text-gray-400 text-sm animate-pulse">Loading analytics...</div>;
  }

  if (!data) return <div className="text-red-400">Failed to load analytics.</div>;

  const LANG_MAP: Record<string, string> = { hi: 'हिंदी', en: 'English', mr: 'Marathi', te: 'Telugu', ta: 'Tamil' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Farmer Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Cohort analysis and engagement metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Farmers" value={data.totalFarmers} />
        <StatCard label="New (Last 30d)" value={data.newLast30d} />
        <StatCard label="Engagement Rate" value={`${data.engagementRate}%`} sub="Farmers who predicted" />
        <StatCard label="Avg Predictions" value={data.avgPredictionsPerFarmer} sub="Per active farmer" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Active Farmers</p>
          <p className="text-3xl font-bold text-green-400">{data.activeVsInactive.active}</p>
          <p className="text-xs text-gray-500 mt-0.5">{data.activeVsInactive.inactive} inactive</p>
        </div>
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">With Predictions</p>
          <p className="text-3xl font-bold text-blue-400">{data.withPredictions}</p>
          <p className="text-xs text-gray-500 mt-0.5">out of {data.totalFarmers} total</p>
        </div>
      </div>

      {/* Registration trend */}
      <div className="rounded-xl bg-gray-800 border border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Registration Trend (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.registrationTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e5e7eb' }} itemStyle={{ color: '#4ade80' }} />
            <Line type="monotone" dataKey="count" stroke="#4ade80" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: '#4ade80' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* By State */}
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Farmers by State (Top 10)</h2>
          {data.byState.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.byState} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e5e7eb' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm">No state data yet</p>
          )}
        </div>

        {/* By Language */}
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Language Preference</h2>
          <div className="space-y-3">
            {data.byLanguage.map((lang) => {
              const pct = data.totalFarmers > 0 ? Math.round((lang.count / data.totalFarmers) * 100) : 0;
              return (
                <div key={lang.language}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{LANG_MAP[lang.language] ?? lang.language}</span>
                    <span className="text-gray-400">{lang.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
