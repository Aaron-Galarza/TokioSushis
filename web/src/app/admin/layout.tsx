'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, ShoppingBag, Utensils, Tag, Settings, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const NAV = [
  { href: '/admin', label: 'Vista General', icon: BarChart3, exact: true },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/products', label: 'Menú', icon: Utensils },
  { href: '/admin/coupons', label: 'Cupones', icon: Tag },
  { href: '/admin/config', label: 'Configuración', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/login');
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Top header */}
      <header className="relative flex items-center h-14 px-4 border-b border-white/10 bg-[#0A0A0A]">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 font-heading italic text-sm font-semibold tracking-[0.2em] text-primary whitespace-nowrap">
          PANEL DE ADMINISTRACIÓN
        </h1>

        <button
          onClick={logout}
          className="ml-auto text-red-400/50 hover:text-red-300 text-xs transition-colors"
        >
          Salir
        </button>
      </header>

      {/* Tab navigation */}
      <nav className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0A0A0A] overflow-x-auto scrollbar-none">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-primary text-black'
                  : 'border border-white/15 text-white/50 hover:text-white hover:border-white/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      <div className="flex-1 p-5 md:p-6 max-w-6xl w-full mx-auto">
        {children}
      </div>
    </div>
  );
}
