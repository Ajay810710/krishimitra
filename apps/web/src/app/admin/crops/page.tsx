'use client';

import { useEffect, useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { createAdminClient, getAdminKey } from '@/lib/admin-client';

interface Crop {
  id: string; name: string; nameHindi: string | null; category: string;
  isActive: boolean; typicalDaysToHarvest: number | null;
  yieldPerAcreMin: number | null; yieldPerAcreMax: number | null;
  _count: { predictions: number; mandiPrices: number };
}

const CATEGORY_COLOR: Record<string, string> = {
  VEGETABLE: 'bg-green-100 text-green-700',
  GRAIN:     'bg-yellow-100 text-yellow-700',
  FRUIT:     'bg-orange-100 text-orange-700',
  SPICE:     'bg-red-100 text-red-700',
  PULSE:     'bg-purple-100 text-purple-700',
  OILSEED:   'bg-blue-100 text-blue-700',
};

export default function AdminCropsPage() {
  const [crops, setCrops]     = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId]   = useState<string | null>(null);
  const [editData, setEditData] = useState<{ yieldPerAcreMin: string; yieldPerAcreMax: string; isActive: boolean }>({
    yieldPerAcreMin: '', yieldPerAcreMax: '', isActive: true,
  });

  const load = async () => {
    setLoading(true);
    const res = await createAdminClient(getAdminKey()).get('/crops');
    setCrops(res.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (crop: Crop) => {
    setEditId(crop.id);
    setEditData({
      yieldPerAcreMin: crop.yieldPerAcreMin?.toString() ?? '',
      yieldPerAcreMax: crop.yieldPerAcreMax?.toString() ?? '',
      isActive: crop.isActive,
    });
  };

  const saveEdit = async (id: string) => {
    const client = createAdminClient(getAdminKey());
    await client.put(`/crops/${id}`, {
      isActive: editData.isActive,
      ...(editData.yieldPerAcreMin ? { yieldPerAcreMin: parseFloat(editData.yieldPerAcreMin) } : {}),
      ...(editData.yieldPerAcreMax ? { yieldPerAcreMax: parseFloat(editData.yieldPerAcreMax) } : {}),
    });
    setEditId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crops</h1>
        <p className="text-sm text-gray-500">Manage active crops and yield estimates</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              {['Crop', 'Category', 'Days to Harvest', 'Yield (tons/acre)', 'Price Records', 'Predictions', 'Status', 'Edit'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>{Array(8).fill(0).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100" /></td>
                ))}</tr>
              ))
            ) : crops.map((crop) => (
              <tr key={crop.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{crop.name}</p>
                  <p className="text-xs text-gray-400">{crop.nameHindi}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[crop.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {crop.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{crop.typicalDaysToHarvest ?? '—'}</td>
                <td className="px-4 py-3">
                  {editId === crop.id ? (
                    <div className="flex gap-1">
                      <input type="number" step="0.1" placeholder="Min"
                        value={editData.yieldPerAcreMin}
                        onChange={(e) => setEditData((d) => ({ ...d, yieldPerAcreMin: e.target.value }))}
                        className="w-16 rounded border border-gray-200 px-2 py-1 text-xs focus:border-krishna-500 focus:outline-none"
                      />
                      <span className="self-center text-gray-400">–</span>
                      <input type="number" step="0.1" placeholder="Max"
                        value={editData.yieldPerAcreMax}
                        onChange={(e) => setEditData((d) => ({ ...d, yieldPerAcreMax: e.target.value }))}
                        className="w-16 rounded border border-gray-200 px-2 py-1 text-xs focus:border-krishna-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-600">
                      {crop.yieldPerAcreMin && crop.yieldPerAcreMax
                        ? `${crop.yieldPerAcreMin}–${crop.yieldPerAcreMax}`
                        : '—'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{crop._count.mandiPrices}</td>
                <td className="px-4 py-3 text-center text-gray-600">{crop._count.predictions}</td>
                <td className="px-4 py-3">
                  {editId === crop.id ? (
                    <select value={editData.isActive ? 'true' : 'false'}
                      onChange={(e) => setEditData((d) => ({ ...d, isActive: e.target.value === 'true' }))}
                      className="rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${crop.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {crop.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === crop.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(crop.id)} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditId(null)} className="rounded-lg bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(crop)} className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
