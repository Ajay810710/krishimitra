'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Plus } from 'lucide-react';
import { getAdminKey } from '@/lib/admin-client';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
function adminClient() {
  return axios.create({ baseURL: `${API}/api`, headers: { 'x-admin-key': getAdminKey() } });
}

interface Crop { id: string; name: string; nameHindi: string | null; category: string; }
interface Mandi { id: string; name: string; district: string; state: string; }

export default function ManualPricePage() {
  const [form, setForm] = useState({
    cropId: '', mandiId: '', priceDate: new Date().toISOString().split('T')[0],
    minPriceKg: '', maxPriceKg: '', modalPriceKg: '', arrivalTons: '', source: 'ADMIN_MANUAL',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: cropsData } = useQuery<Crop[]>({
    queryKey: ['admin-crops-select'],
    queryFn: () => adminClient().get('/admin/crops').then((r) => r.data.data),
    staleTime: 1000 * 60 * 60,
  });

  const { data: mandisData } = useQuery<Mandi[]>({
    queryKey: ['admin-mandis-select'],
    queryFn: () => adminClient().get('/admin/mandis').then((r) => r.data.data),
    staleTime: 1000 * 60 * 60,
  });

  async function submit() {
    if (!form.cropId || !form.mandiId || !form.modalPriceKg) {
      setError('Crop, Mandi, and Modal Price are required.');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const r = await fetch(`${API}/admin/prices/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() ?? '' },
        body: JSON.stringify({
          cropId: form.cropId,
          mandiId: form.mandiId,
          priceDate: form.priceDate,
          minPriceKg: Number(form.minPriceKg) || Number(form.modalPriceKg),
          maxPriceKg: Number(form.maxPriceKg) || Number(form.modalPriceKg),
          modalPriceKg: Number(form.modalPriceKg),
          arrivalTons: form.arrivalTons ? Number(form.arrivalTons) : undefined,
          source: form.source,
        }),
      });
      if (!r.ok) throw new Error('Failed');
      const d = await r.json();
      setSuccess(`Price entry saved for ${new Date(d.data.priceDate).toLocaleDateString()}`);
      setForm({ ...form, minPriceKg: '', maxPriceKg: '', modalPriceKg: '', arrivalTons: '' });
    } catch {
      setError('Failed to save price entry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manual Price Entry</h1>
        <p className="text-gray-400 text-sm mt-1">Add or override mandi price data manually</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700 p-4 text-green-300">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-900/40 border border-red-700 p-4 text-red-300">{error}</div>
      )}

      <div className="rounded-xl bg-gray-800 border border-gray-700 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Crop *</label>
            <select value={form.cropId} onChange={(e) => setForm({ ...form, cropId: e.target.value })}
              className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none">
              <option value="">Select crop...</option>
              {cropsData?.map((c) => (
                <option key={c.id} value={c.id}>{c.nameHindi ?? c.name} ({c.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mandi *</label>
            <select value={form.mandiId} onChange={(e) => setForm({ ...form, mandiId: e.target.value })}
              className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none">
              <option value="">Select mandi...</option>
              {mandisData?.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.state}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Price Date *</label>
          <input type="date" value={form.priceDate} onChange={(e) => setForm({ ...form, priceDate: e.target.value })}
            className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'modalPriceKg', label: 'Modal Price (₹/kg) *' },
            { key: 'minPriceKg',   label: 'Min Price (₹/kg)' },
            { key: 'maxPriceKg',   label: 'Max Price (₹/kg)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
              <input type="number" step="0.01" min="0"
                value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Arrival (tons)</label>
            <input type="number" step="0.1" min="0" value={form.arrivalTons}
              onChange={(e) => setForm({ ...form, arrivalTons: e.target.value })}
              className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Source</label>
            <input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none" />
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
          <Plus className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Price Entry'}
        </button>
      </div>

      <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 text-sm text-gray-400">
        <p className="font-semibold text-gray-300 mb-1">Note</p>
        <p>If a price entry already exists for this crop + mandi + date, it will be updated (upserted). All prices are in ₹/kg.</p>
      </div>
    </div>
  );
}
