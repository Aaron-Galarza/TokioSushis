'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const AUTH_STORAGE_KEY = 'american-way-auth-storage';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = raw ? JSON.parse(raw)?.state?.token : null;
      if (token) {
        setIsAuthorized(true);
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!isAuthorized) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-xs tracking-widest uppercase">Verificando Credenciales...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="flex items-center justify-between gap-2 h-14 px-3 sm:px-4 border-b border-white/10 bg-[#0A0A0A] shrink-0">

        {/* Izquierda: volver (solo flecha en mobile, flecha+texto en desktop) */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm shrink-0"
          aria-label="Volver al menú"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Volver al Menú</span>
        </button>

        {/* Centro: logo + nombre */}
        <div className="flex items-center gap-2 min-w-0">
          <img src="/tokyoSushis.webp" alt="Tokyo Sushis" className="h-7 w-7 object-contain shrink-0" />
          <span className="font-heading text-sm font-bold tracking-wide text-primary truncate hidden xs:inline sm:inline">
            TOKYO SUSHIS
          </span>
        </div>

        {/* Derecha: salir (solo ícono en mobile) */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-red-400/60 hover:text-red-300 text-xs transition-colors shrink-0"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}