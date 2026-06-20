'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/login');
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="relative flex items-center h-14 px-4 border-b border-white/10 bg-[#0A0A0A] shrink-0">
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
        <button onClick={logout} className="ml-auto text-red-400/50 hover:text-red-300 text-xs transition-colors">
          Salir
        </button>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
