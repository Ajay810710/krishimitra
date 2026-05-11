'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { createAdminClient, setAdminKey } from '@/lib/admin-client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const client = createAdminClient(key.trim());
      await client.get('/stats');
      setAdminKey(key.trim());
      router.replace('/admin');
    } catch {
      setError('Invalid admin key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-krishna-600">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-gray-400">KrishiMitra Control Panel</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-2xl bg-gray-800 p-6 shadow-xl">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin secret key"
              className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-white placeholder-gray-400 focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-500/30"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full rounded-xl bg-krishna-600 py-3 text-sm font-semibold text-white transition hover:bg-krishna-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
