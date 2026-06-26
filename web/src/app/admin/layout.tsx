'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

// Clave bajo la que Zustand persist guarda el estado de auth
const AUTH_STORAGE_KEY = 'american-way-auth-storage';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Lectura directa de localStorage: síncrona, sin esperar hidratación de Zustand.
  // Funciona igual en carga inicial que al reactivar una pestaña suspendida.
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

  // El logout limpia el store y saca al usuario del panel en el acto
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
        <button onClick={handleLogout} className="ml-auto text-red-400/50 hover:text-red-300 text-xs transition-colors">
          Salir
        </button>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}