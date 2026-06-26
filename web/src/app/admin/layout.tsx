'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  
  // 🔐 CONTROL DE HIDRATACIÓN: Nos aseguramos de que Zustand ya leyó el localStorage
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Forzamos a esperar un tick de render para asegurarnos de que Zustand se sincronizó
    const hasHydrated = useAuthStore.persist?.hasHydrated();
    if (hasHydrated || hasHydrated === undefined) {
      setIsReady(true);
    } else {
      const unsub = useAuthStore.persist.onHydrate(() => setIsReady(true));
      return () => unsub();
    }
  }, []);

  // 🛡️ REGLA DE PROTECCIÓN: Si ya leyó la memoria y no está autenticado, rebota al login
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isReady, isAuthenticated, router]);

  // ⏳ PANTALLA DE CARGA (Loading State): Bloquea los 'children' para que no ejecuten APIs sin token
  if (!isReady || !isAuthenticated) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-xs tracking-widest uppercase">Verificando Credenciales...</p>
      </div>
    );
  }

  // ✨ Si está todo en orden, se monta el panel completo de forma segura
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