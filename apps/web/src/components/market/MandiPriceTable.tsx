'use client';

import type { MandiPrice } from '@krishimitra/shared';
import { formatDate } from '@krishimitra/shared';

interface Props {
  prices: MandiPrice[];
  isLoading: boolean;
}

export function MandiPriceTable({ prices, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
        इस फसल और मंडी के लिए कोई डेटा उपलब्ध नहीं है
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="font-semibold text-gray-800">मूल्य इतिहास</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 text-left">दिनांक</th>
              <th className="px-4 py-3 text-right">न्यूनतम</th>
              <th className="px-4 py-3 text-right">मध्य भाव</th>
              <th className="px-4 py-3 text-right">अधिकतम</th>
              {prices[0]?.variety && <th className="px-4 py-3 text-left">किस्म</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prices.map((price) => (
              <tr key={price.id} className="transition hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{formatDate(price.priceDate)}</td>
                <td className="px-4 py-3 text-right font-medium text-orange-600">
                  ₹{Number(price.minPriceKg).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-krishna-700">
                  ₹{Number(price.modalPriceKg).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-green-600">
                  ₹{Number(price.maxPriceKg).toFixed(2)}
                </td>
                {price.variety && (
                  <td className="px-4 py-3 text-gray-500">{price.variety}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
