'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { createAdminClient, getAdminKey } from '@/lib/admin-client';

interface Farmer {
  id: string; name: string; phone: string; preferredLanguage: string;
  isVerified: boolean; isActive: boolean; createdAt: string;
  mandi: { name: string } | null;
  _count: { predictions: number };
}

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const client = createAdminClient(getAdminKey());
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (q) params.set('search', q);
      const res = await client.get(`/farmers?${params}`);
      setFarmers(res.data.data.farmers);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, search); }, [page, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const client = createAdminClient(getAdminKey());
    await client.put(`/farmers/${id}`, { isActive: !current });
    load(page, search);
  };

  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
          <p className="text-sm text-gray-500">{total} total registered farmers</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
          />
        </div>
        <button type="submit" className="rounded-xl bg-krishna-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-krishna-700">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              {['Name', 'Phone', 'Mandi', 'Language', 'Predictions', 'Joined', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(8).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : farmers.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                <td className="px-4 py-3 text-gray-600">{f.phone}</td>
                <td className="px-4 py-3 text-gray-600">{f.mandi?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{f.preferredLanguage}</td>
                <td className="px-4 py-3 text-center font-semibold text-krishna-700">{f._count.predictions}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(f.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {f.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(f.id, f.isActive)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      f.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {f.isActive ? <><UserX className="h-3 w-3" /> Deactivate</> : <><UserCheck className="h-3 w-3" /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">Page {page} of {pages} ({total} total)</p>
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
