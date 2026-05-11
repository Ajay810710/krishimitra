'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Plus, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('km_token') || sessionStorage.getItem('km_token') || '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

async function fetchHealth() {
  const r = await fetch(`${API}/soil/health`, { headers: authHeaders() });
  if (!r.ok) throw new Error('Failed');
  return (await r.json()).data;
}

async function fetchHistory() {
  const r = await fetch(`${API}/soil/history`, { headers: authHeaders() });
  if (!r.ok) throw new Error('Failed');
  return (await r.json()).data as SoilTest[];
}

interface SoilTest {
  id: string;
  testDate: string;
  labName?: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  ph?: number;
  organicMatter?: number;
  notes?: string;
  landParcel?: { name: string };
}

interface Recommendation {
  nutrient: string;
  status: string;
  statusHi: string;
  advice: string;
  adviceHi: string;
}

const STATUS_COLOR: Record<string, string> = {
  Low: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Acidic: 'bg-yellow-100 text-yellow-700',
  Alkaline: 'bg-purple-100 text-purple-700',
};

export default function SoilPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    testDate: new Date().toISOString().split('T')[0],
    labName: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    organicMatter: '',
    notes: '',
  });

  const health = useQuery({ queryKey: ['soil-health'], queryFn: fetchHealth });
  const history = useQuery({ queryKey: ['soil-history'], queryFn: fetchHistory });

  const addTest = useMutation({
    mutationFn: async (data: typeof form) => {
      const body: Record<string, unknown> = { testDate: data.testDate };
      if (data.labName) body.labName = data.labName;
      if (data.nitrogen) body.nitrogen = Number(data.nitrogen);
      if (data.phosphorus) body.phosphorus = Number(data.phosphorus);
      if (data.potassium) body.potassium = Number(data.potassium);
      if (data.ph) body.ph = Number(data.ph);
      if (data.organicMatter) body.organicMatter = Number(data.organicMatter);
      if (data.notes) body.notes = data.notes;
      const r = await fetch(`${API}/soil/test`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['soil-health'] });
      qc.invalidateQueries({ queryKey: ['soil-history'] });
      setShowForm(false);
      setForm({ testDate: new Date().toISOString().split('T')[0], labName: '', nitrogen: '', phosphorus: '', potassium: '', ph: '', organicMatter: '', notes: '' });
    },
  });

  const h = health.data;

  const scoreColor = h?.color === 'green' ? 'text-green-600' : h?.color === 'amber' ? 'text-amber-600' : 'text-red-500';
  const scoreBg = h?.color === 'green' ? 'bg-green-50 border-green-200' : h?.color === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">मिट्टी स्वास्थ्य</h1>
          <p className="text-sm text-gray-500 mt-0.5">मिट्टी परीक्षण और पोषक तत्व अनुशंसाएं</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-krishna-600 px-4 py-2 text-sm font-semibold text-white hover:bg-krishna-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          परीक्षण जोड़ें
        </button>
      </div>

      {/* Health Score */}
      {h?.hasData && (
        <div className={`rounded-xl border p-5 ${scoreBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">मिट्टी स्वास्थ्य स्कोर</p>
              <p className={`text-4xl font-bold mt-1 ${scoreColor}`}>{h.score}<span className="text-lg">/100</span></p>
              <p className="text-sm font-semibold mt-0.5">{h.labelHi}</p>
            </div>
            <FlaskConical className={`h-12 w-12 ${scoreColor} opacity-30`} />
          </div>
        </div>
      )}

      {!h?.hasData && !health.isLoading && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <FlaskConical className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{h?.messageHi || 'कोई डेटा नहीं'}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg bg-krishna-600 px-5 py-2 text-sm font-semibold text-white hover:bg-krishna-700"
          >
            पहला परीक्षण जोड़ें
          </button>
        </div>
      )}

      {/* Recommendations */}
      {h?.recommendations?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">पोषक तत्व अनुशंसाएं</h2>
          <div className="space-y-3">
            {(h.recommendations as Recommendation[]).map((rec, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-800">{rec.nutrient}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[rec.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {rec.statusHi}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{rec.adviceHi}</p>
                <p className="text-xs text-gray-400 mt-0.5">{rec.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.data && history.data.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">परीक्षण इतिहास</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {history.data.map((test) => (
              <div key={test.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(test.testDate).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {test.labName && <p className="text-xs text-gray-500">{test.labName}</p>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {test.nitrogen != null && <span>N: {test.nitrogen}</span>}
                    {test.phosphorus != null && <span>P: {test.phosphorus}</span>}
                    {test.potassium != null && <span>K: {test.potassium}</span>}
                    {test.ph != null && <span>pH: {test.ph}</span>}
                  </div>
                </div>
                {test.notes && <p className="text-xs text-gray-400 mt-1">{test.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">मिट्टी परीक्षण जोड़ें</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-gray-600">परीक्षण तिथि *</label>
                <input type="date" value={form.testDate} onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-krishna-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">प्रयोगशाला का नाम</label>
                <input type="text" placeholder="Lab name" value={form.labName} onChange={(e) => setForm({ ...form, labName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-krishna-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'nitrogen', label: 'नाइट्रोजन (N) kg/ha' },
                  { key: 'phosphorus', label: 'फॉस्फोरस (P) kg/ha' },
                  { key: 'potassium', label: 'पोटैशियम (K) kg/ha' },
                  { key: 'ph', label: 'pH (0–14)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" step="0.01" value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-krishna-400 focus:outline-none" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">जैव पदार्थ (Organic Matter %)</label>
                <input type="number" step="0.01" value={form.organicMatter} onChange={(e) => setForm({ ...form, organicMatter: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-krishna-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">नोट्स</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-krishna-400 focus:outline-none" />
              </div>
            </div>
            <div className="border-t border-gray-100 px-5 py-4 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                रद्द करें
              </button>
              <button onClick={() => addTest.mutate(form)} disabled={addTest.isPending}
                className="flex-1 rounded-xl bg-krishna-600 py-2.5 text-sm font-semibold text-white hover:bg-krishna-700 disabled:opacity-60">
                {addTest.isPending ? 'सहेज रहे हैं...' : 'सहेजें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
