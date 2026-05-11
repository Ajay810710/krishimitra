'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react';
import { createAdminClient, getAdminKey } from '@/lib/admin-client';

interface SyncStatus {
  waiting: number; active: number; completed: number; failed: number;
  recentJobs: {
    id: string | undefined; name: string; state: string;
    date?: string; triggeredBy?: string;
    processedAt: string | null; finishedAt: string | null;
  }[];
}

export default function AdminSyncPage() {
  const [status, setStatus]   = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDate, setSyncDate] = useState(new Date().toISOString().split('T')[0]);
  const [syncMsg, setSyncMsg] = useState('');

  const loadStatus = async () => {
    try {
      const res = await createAdminClient(getAdminKey()).get('/sync/status');
      setStatus(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await createAdminClient(getAdminKey()).post('/sync', { date: syncDate });
      setSyncMsg(`✅ ${res.data.data.message}`);
      setTimeout(loadStatus, 2000);
    } catch {
      setSyncMsg('❌ Failed to trigger sync. Check API key and server.');
    } finally {
      setSyncing(false);
    }
  };

  const STATE_ICON: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed:    <XCircle    className="h-4 w-4 text-red-500"   />,
    active:    <Clock      className="h-4 w-4 text-blue-500 animate-spin" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Sync</h1>
        <p className="text-sm text-gray-500">Trigger manual mandi price ingestion or check job status</p>
      </div>

      {/* Queue stats */}
      {status && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Waiting',   value: status.waiting,   color: 'text-amber-600'  },
            { label: 'Active',    value: status.active,    color: 'text-blue-600'   },
            { label: 'Completed', value: status.completed, color: 'text-green-600'  },
            { label: 'Failed',    value: status.failed,    color: 'text-red-600'    },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Manual trigger */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 font-semibold text-gray-800">Manual Price Sync</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={syncDate}
              onChange={(e) => setSyncDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
            />
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-krishna-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-krishna-700 disabled:opacity-60"
          >
            {syncing
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Queuing...</>
              : <><PlayCircle className="h-4 w-4" /> Trigger Sync</>}
          </button>
          <button
            onClick={loadStatus}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        {syncMsg && (
          <p className="mt-3 text-sm font-medium text-gray-700">{syncMsg}</p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Automatic sync runs daily at 7:00 AM IST. Manual sync fetches data from data.gov.in for the selected date.
        </p>
      </div>

      {/* Recent jobs */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 font-semibold text-gray-800">Recent Jobs</h2>
        {loading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : status?.recentJobs.length === 0 ? (
          <p className="text-sm text-gray-400">No recent jobs found.</p>
        ) : (
          <div className="space-y-2">
            {status?.recentJobs.map((job, i) => (
              <div key={job.id ?? i} className="flex items-center gap-4 rounded-xl border border-gray-100 px-4 py-3">
                {STATE_ICON[job.state] ?? <Clock className="h-4 w-4 text-gray-400" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{job.name}</p>
                  <p className="text-xs text-gray-400">
                    Date: {job.date ?? '—'} · Triggered by: {job.triggeredBy ?? '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium capitalize ${
                    job.state === 'completed' ? 'text-green-600' :
                    job.state === 'failed'    ? 'text-red-500'   : 'text-blue-500'
                  }`}>{job.state}</p>
                  {job.finishedAt && (
                    <p className="text-xs text-gray-400">{new Date(job.finishedAt).toLocaleTimeString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
