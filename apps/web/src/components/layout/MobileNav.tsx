'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Cloud, FileText, FlaskConical, Home } from 'lucide-react';

const ITEMS = [
  { href: '/',        icon: Home,         label: 'होम' },
  { href: '/market',  icon: BarChart3,    label: 'बाजार' },
  { href: '/weather', icon: Cloud,        label: 'मौसम' },
  { href: '/soil',    icon: FlaskConical, label: 'मिट्टी' },
  { href: '/schemes', icon: FileText,     label: 'योजनाएं' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 bg-white/95 pb-safe shadow-lg backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-5 px-2 py-1 overflow-x-auto">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 rounded-xl py-2 transition-all"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                active
                  ? 'bg-krishna-600 text-white shadow-md shadow-krishna-200'
                  : 'text-gray-400'
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                active ? 'text-krishna-700' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
