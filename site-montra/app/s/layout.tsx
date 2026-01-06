'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface SuperAdminSession {
  email: string;
  role: string;
  exp: number;
}

export default function SuperBackofficeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SuperAdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão
    const stored = localStorage.getItem('superadmin_session');
    if (stored) {
      const parsed = JSON.parse(stored) as SuperAdminSession;
      if (parsed.exp > Date.now()) {
        setSession(parsed);
      } else {
        localStorage.removeItem('superadmin_session');
        router.push('/support-access');
      }
    } else {
      router.push('/support-access');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('superadmin_session');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navItems = [
    { href: '/s/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/s/tenants', label: 'Tenants', icon: '🏢' },
    { href: '/s/billing', label: 'Faturação', icon: '💳' },
    { href: '/s/support', label: 'Suporte', icon: '🎫' },
    { href: '/s/logs', label: 'Logs', icon: '📋' },
    { href: '/s/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-[#222] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#222]">
          <div className="text-lg font-semibold text-white/90">CRM Plus</div>
          <div className="text-xs text-white/40">Platform Admin</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-[#222]">
          <div className="text-xs text-white/40 mb-2">{session.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400 transition"
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
