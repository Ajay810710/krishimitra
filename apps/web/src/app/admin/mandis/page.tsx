'use client';

import { useEffect, useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { createAdminClient, getAdminKey } from '@/lib/admin-client';

interface Mandi {
  id: string; name: string; district: string; state: string;
  pincode: string | null; isActive: boolean;
  _count: { predictions: number; mandiPrices: number };
}

export default function AdminMandisPage() {
  const [mandis, setMandis]   = useState<Mandi[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId]   = useState<string | null>(null);
  const [editActive, setEditActive] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await createAdminClient(getAdminKey()).get('/mandis');
    setMandis(res.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (id: string) => {
    await createAdminClient(getAdminKey()).put(`/mandis/${id}`, { isActive: editActive });
    setEditId(null);
    load();
  };

  // Group mandis by state
  const byState = mandis.reduce<Record<string, Mandi[]>>((acc, m) => {
    if (!acc[m.state]) acc[m.state] = [];
    acc[m.state].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mandis</h1>
        <p className="text-sm text-gray-500">{mandis.length} market locations</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-200" />)}
        </div>
      ) : Object.entries(byState).map(([state, stateMandis]) => (
        <div key={state} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
            <h2 className="font-semibold text-gray-700">{state}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs font-medium uppercase text-gray-500">
              <tr>
                {['Mandi', 'District', 'Pincode', 'Price Records', 'Predictions', 'Status', 'Edit'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stateMandis.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.district}</td>
                  <td className="px-4 py-3 text-gray-500">{m.pincode ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{m._count.mandiPrices}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{m._count.predictions}</td>
                  <td className="px-4 py-3">
                    {editId === m.id ? (
                      <select value={editActive ? 'true' : 'false'}
                        onChange={(e) => setEditActive(e.target.value === 'true')}
                        className="rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === m.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => save(m.id)} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditId(null)} className="rounded-lg bg-gray-200 p-1.5 hover:bg-gray-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(m.id); setEditActive(m.isActive); }}
                        className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
