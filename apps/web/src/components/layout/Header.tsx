'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight, Home, Menu, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const BREADCRUMBS: Record<string, { label: string; labelHi: string }> = {
  '/':          { label: 'Dashboard',    labelHi: 'होम' },
  '/forecast':  { label: 'Forecast',     labelHi: 'मूल्य पूर्वानुमान' },
  '/recommend': { label: 'Crop Advice',  labelHi: 'फसल सलाह' },
  '/market':    { label: 'Market',       labelHi: 'बाजार भाव' },
  '/alerts':    { label: 'Alerts',       labelHi: 'अलर्ट' },
  '/history':   { label: 'History',      labelHi: 'इतिहास' },
  '/profile':   { label: 'Profile',      labelHi: 'प्रोफ़ाइल' },
};

export function Header({ collapsed, onToggle }: HeaderProps) {
  const pathname = usePathname();
  const { farmer } = useAuthStore();
  const [lang, setLang] = useState<'hi' | 'en'>('hi');

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-alerts-count'],
    queryFn: () => apiClient.get('/alerts').then((r) => r.data.data?.unreadCount ?? 0),
    refetchInterval: 60_000,
  });

  const crumb = Object.entries(BREADCRUMBS).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );
  const pageInfo = crumb?.[1] ?? { label: 'KrishiMitra', labelHi: 'KrishiMitra' };

  const initials = (farmer?.name ?? 'F')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/90 px-4 shadow-sm backdrop-blur-md lg:px-6">
      {/* ── Left: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          <Link href="/" className="flex items-center text-gray-400 hover:text-krishna-600 transition">
            <Home className="h-3.5 w-3.5" />
          </Link>
          {pathname !== '/' && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              <span className="font-semibold text-gray-800">
                {lang === 'hi' ? pageInfo.labelHi : pageInfo.label}
              </span>
            </>
          )}
          {pathname === '/' && (
            <span className="font-semibold text-gray-800">
              {lang === 'hi' ? pageInfo.labelHi : pageInfo.label}
            </span>
          )}
        </nav>
      </div>

      {/* ── Right: language toggle + bell + avatar ── */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLang((l) => (l === 'hi' ? 'en' : 'hi'))}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-krishna-300 hover:text-krishna-700"
        >
          <Globe className="h-3.5 w-3.5" />
          {lang === 'hi' ? 'EN' : 'हि'}
        </button>

        {/* Notification bell */}
        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm text-gray-500 transition hover:border-krishna-300 hover:text-krishna-600"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-krishna-500 to-krishna-700 text-xs font-bold text-white shadow-md shadow-krishna-200 transition hover:shadow-lg"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
