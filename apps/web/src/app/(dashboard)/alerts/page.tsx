'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { timeAgo } from '@krishimitra/shared';

interface Alert {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['alerts-all'],
    queryFn: () => apiClient.get('/alerts?limit=50').then((r) => r.data),
  });

  const alerts: Alert[] = data?.data?.alerts ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">अलर्ट</h1>
          <p className="mt-1 text-sm text-gray-500">मूल्य और बाजार सूचनाएं</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <Bell className="mb-3 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-500">कोई अलर्ट नहीं</p>
          <p className="mt-1 text-sm text-gray-400">जब कोई नया बाजार अपडेट होगा तो यहाँ दिखेगा</p>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-4 rounded-2xl p-4 shadow-sm ring-1 ${
              alert.isRead ? 'bg-white ring-gray-100' : 'bg-krishna-50 ring-krishna-200'
            }`}
          >
            <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              alert.isRead ? 'bg-gray-100 text-gray-400' : 'bg-krishna-100 text-krishna-600'
            }`}>
              {alert.isRead ? <CheckCheck className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-semibold ${alert.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                  {alert.title}
                </p>
                <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(alert.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
