'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { getAdminKey } from '@/lib/admin-client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TYPES = [
  { value: 'BROADCAST', label: 'सामान्य घोषणा' },
  { value: 'PRICE_ALERT', label: 'मूल्य अलर्ट' },
  { value: 'WEATHER_ALERT', label: 'मौसम चेतावनी' },
  { value: 'SCHEME_ALERT', label: 'योजना सूचना' },
  { value: 'MARKET_UPDATE', label: 'बाजार अपडेट' },
];

export default function BroadcastPage() {
  const [form, setForm] = useState({
    title: '', titleHi: '', message: '', messageHi: '', type: 'BROADCAST',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; message: string } | null>(null);
  const [error, setError] = useState('');

  async function send() {
    if (!form.title || !form.message) {
      setError('Title and message are required.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(`${API}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() ?? '' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error('Failed');
      const d = await r.json();
      setResult(d.data);
      setForm({ title: '', titleHi: '', message: '', messageHi: '', type: 'BROADCAST' });
    } catch {
      setError('Failed to send broadcast.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Broadcast Alert</h1>
        <p className="text-gray-400 text-sm mt-1">Send a push notification to all active farmers</p>
      </div>

      {result && (
        <div className="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700 p-4 text-green-300">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{result.message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-900/40 border border-red-700 p-4 text-red-300">{error}</div>
      )}

      <div className="rounded-xl bg-gray-800 border border-gray-700 p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Alert Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label} ({t.value})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Title (English)</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Market Alert"
              className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">शीर्षक (हिंदी)</label>
            <input value={form.titleHi} onChange={(e) => setForm({ ...form, titleHi: e.target.value })}
              placeholder="e.g. बाजार अलर्ट"
              className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Message (English)</label>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
            placeholder="Alert message in English..."
            className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500 focus:outline-none resize-none" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">संदेश (हिंदी)</label>
          <textarea value={form.messageHi} onChange={(e) => setForm({ ...form, messageHi: e.target.value })} rows={3}
            placeholder="हिंदी में संदेश..."
            className="mt-1.5 w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-green-500 focus:outline-none resize-none" />
        </div>

        <button onClick={send} disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
          <Send className="h-4 w-4" />
          {loading ? 'Sending...' : 'Send to All Farmers'}
        </button>
      </div>

      <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 text-sm text-gray-400">
        <p className="font-semibold text-gray-300 mb-1">Note</p>
        <p>This will create an in-app alert for every active farmer. The alert will appear in their Alerts tab.</p>
      </div>
    </div>
  );
}
