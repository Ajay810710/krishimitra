'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Sprout, MapPin,
  BarChart3, RefreshCw, LogOut, Shield,
} from 'lucide-react';
import { getAdminKey, clearAdminKey } from '@/lib/admin-client';

const NAV = [
  { href: '/admin',             icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/farmers',     icon: Users,           label: 'Farmers' },
  { href: '/admin/predictions', icon: BarChart3,       label: 'Predictions' },
  { href: '/admin/crops',       icon: Sprout,          label: 'Crops' },
  { href: '/admin/mandis',      icon: MapPin,          label: 'Mandis' },
  { href: '/admin/sync',        icon: RefreshCw,       label: 'Price Sync' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = getAdminKey();
    if (!key && pathname !== '/admin/login') {
      router.replace('/admin/login');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready && pathname !== '/admin/login') return null;
  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = () => {
    clearAdminKey();
    router.replace('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col bg-gray-900 text-white">
        <div className="flex items-center gap-2 border-b border-gray-700 px-5 py-4">
          <Shield className="h-5 w-5 text-krishna-400" />
          <span className="text-sm font-bold tracking-wide text-white">KrishiMitra Admin</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-krishna-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
