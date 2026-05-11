'use client';

import { useEffect, useState } from 'react';
import { Users, BarChart3, Sprout, MapPin, Database, Bell, TrendingUp, Clock } from 'lucide-react';
import { createAdminClient, getAdminKey } from '@/lib/admin-client';

interface Stats {
  farmers:      { total: number; active: number; newLast7d: number };
  predictions:  { total: number; last7d: number; breakdown: { recommendation: string | null; _count: number }[] };
  crops:        { total: number; active: number };
  mandis:       { total: number };
  priceRecords: { total: number; lastIngestAt: string | null };
  alerts:       { total: number; unread: number };
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createAdminClient(getAdminKey());
    client.get('/stats').then((r) => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  const recMap: Record<string, string> = {
    PLANT: 'बोएं', WAIT: 'प्रतीक्षा', CONSIDER_ALTERNATIVES: 'विकल्प',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-red-500">Failed to load stats.</p>;

  const cards = [
    {
      icon: Users, color: 'bg-blue-500', label: 'Farmers',
      value: stats.farmers.total,
      sub: `${stats.farmers.active} active · ${stats.farmers.newLast7d} new this week`,
    },
    {
      icon: BarChart3, color: 'bg-krishna-600', label: 'Predictions',
      value: stats.predictions.total,
      sub: `${stats.predictions.last7d} this week`,
    },
    {
      icon: Sprout, color: 'bg-emerald-500', label: 'Crops',
      value: stats.crops.total,
      sub: `${stats.crops.active} active`,
    },
    {
      icon: MapPin, color: 'bg-orange-500', label: 'Mandis',
      value: stats.mandis.total,
      sub: 'market locations',
    },
    {
      icon: Database, color: 'bg-purple-500', label: 'Price Records',
      value: stats.priceRecords.total.toLocaleString(),
      sub: stats.priceRecords.lastIngestAt
        ? `Last sync: ${new Date(stats.priceRecords.lastIngestAt).toLocaleDateString()}`
        : 'No sync yet',
    },
    {
      icon: Bell, color: 'bg-red-500', label: 'Alerts',
      value: stats.alerts.total,
      sub: `${stats.alerts.unread} unread`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">KrishiMitra platform overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon: Icon, color, label, value, sub }) => (
          <div key={label} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Prediction breakdown */}
      {stats.predictions.breakdown.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-krishna-600" />
            <h2 className="font-semibold text-gray-800">Prediction Breakdown</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.predictions.breakdown.map((b) => {
              const label = b.recommendation ? (recMap[b.recommendation] ?? b.recommendation) : 'Unknown';
              const colors: Record<string, string> = {
                PLANT: 'bg-green-100 text-green-700',
                WAIT:  'bg-amber-100 text-amber-700',
                CONSIDER_ALTERNATIVES: 'bg-blue-100 text-blue-700',
              };
              const cls = b.recommendation ? colors[b.recommendation] : 'bg-gray-100 text-gray-600';
              return (
                <div key={b.recommendation} className={`rounded-xl px-4 py-2 text-sm font-medium ${cls}`}>
                  {label}: <span className="font-bold">{b._count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
