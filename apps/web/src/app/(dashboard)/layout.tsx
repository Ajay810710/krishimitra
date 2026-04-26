'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuthStore } from '@/stores/auth.store';
import { QueryProvider } from '@/lib/query-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0fdf4]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-krishna-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  // Sidebar widths: expanded=240px, collapsed=68px
  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <QueryProvider>
      <div className="min-h-screen bg-[#f0fdf4]">
        {/* Fixed sidebar */}
        <Sidebar collapsed={collapsed} onToggle={toggle} />

        {/* Page content — pushed right by sidebar on desktop */}
        <div
          className="flex min-h-screen flex-col transition-all duration-300 pb-20 lg:pb-0"
          style={{ paddingLeft: `max(0px, ${sidebarWidth}px)` }}
        >
          {/* Override padding on mobile */}
          <style>{`@media(max-width:1023px){.km-shell{padding-left:0!important}}`}</style>
          <div className="km-shell flex flex-1 flex-col">
            <Header collapsed={collapsed} onToggle={toggle} />
            <main className="flex-1 p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </QueryProvider>
  );
}
