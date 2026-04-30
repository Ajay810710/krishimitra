'use client';

import type { Mandi } from '@krishimitra/shared';

interface Props {
  mandis: Mandi[];
  selectedMandiId: string;
  onSelect: (id: string) => void;
}

export function MandiSelector({ mandis, selectedMandiId, onSelect }: Props) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">मंडी चुनें</label>
      <select
        value={selectedMandiId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
      >
        <option value="">-- मंडी चुनें --</option>
        {mandis.map((mandi) => (
          <option key={mandi.id} value={mandi.id}>
            {mandi.name} ({mandi.district}, {mandi.state})
          </option>
        ))}
      </select>
    </div>
  );
}
