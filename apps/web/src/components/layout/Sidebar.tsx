'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertCircle, BarChart3, ChevronLeft, ChevronRight,
  Clock, Cloud, FileText, FlaskConical, Home, Leaf, LogOut, TrendingUp, User,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { maskPhone } from '@krishimitra/shared';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { href: '/',          label: 'होम',             labelEn: 'Home',         icon: Home },
  { href: '/forecast',  label: 'मूल्य पूर्वानुमान', labelEn: 'Forecast',     icon: TrendingUp },
  { href: '/recommend', label: 'फसल सलाह',         labelEn: 'Crop Advice',  icon: Leaf },
  { href: '/market',    label: 'बाजार भाव',         labelEn: 'Market',       icon: BarChart3 },
  { href: '/weather',   label: 'मौसम',              labelEn: 'Weather',      icon: Cloud },
  { href: '/soil',      label: 'मिट्टी स्वास्थ्य',   labelEn: 'Soil Health',  icon: FlaskConical },
  { href: '/schemes',   label: 'सरकारी योजनाएं',    labelEn: 'Gov Schemes',  icon: FileText },
  { href: '/alerts',    label: 'अलर्ट',             labelEn: 'Alerts',       icon: AlertCircle },
  { href: '/history',   label: 'इतिहास',            labelEn: 'History',      icon: Clock },
  { href: '/profile',   label: 'प्रोफ़ाइल',          labelEn: 'Profile',      icon: User },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname  = usePathname();
  const { farmer, logout } = useAuthStore();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const initials = (farmer?.name ?? 'F')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden flex-col lg:flex transition-all duration-300 overflow-hidden"
      style={{
        width: collapsed ? 68 : 240,
        background: 'linear-gradient(180deg, #14532d 0%, #166534 60%, #15803d 100%)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl shadow">
            🌾
          </div>
          {!collapsed && (
            <div className="animate-fade-up overflow-hidden">
              <p className="truncate text-base font-bold text-white leading-none">KrishiMitra</p>
              <p className="truncate text-[10px] text-white/50 mt-0.5">कृषिमित्र — AI सलाहकार</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            मेनू
          </p>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.labelEn : undefined}
                  className={`sidebar-link ${active ? 'sidebar-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-white/60'}`} />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!collapsed && active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mandi-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User section ── */}
      <div className="border-t border-white/10 px-3 py-4 space-y-2">
        {/* User info */}
        <div className={`flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 ${collapsed ? 'justify-center px-0 bg-transparent' : ''}`}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-mandi-400 text-xs font-bold text-white shadow">
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-white">{farmer?.name ?? 'किसान'}</p>
              <p className="truncate text-xs text-white/50">{maskPhone(farmer?.phone ?? '')}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={`sidebar-link w-full text-red-300 hover:bg-red-500/20 hover:text-red-200 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>लॉगआउट</span>}
        </button>
      </div>
    </aside>
  );
}
