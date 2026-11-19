'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    localStorage.removeItem('american-way-auth-storage');
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch('/api/admin-auth/logout', { method: 'POST', cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cerrar la sesión');
      window.location.replace('/login');
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  };

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="flex items-center justify-between gap-2 h-14 px-3 sm:px-4 border-b border-white/10 bg-[#0A0A0A] shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm shrink-0" aria-label="Volver al menú">
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Volver al Menú</span>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tokyoSushis.webp" alt="Tokyo Sushis" className="h-7 w-7 object-contain shrink-0" />
          <span className="font-heading text-sm font-bold tracking-wide text-primary truncate hidden xs:inline sm:inline">TOKYO SUSHIS</span>
        </div>
        <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-1.5 text-red-400/60 hover:text-red-300 text-xs transition-colors shrink-0 disabled:opacity-40" aria-label="Cerrar sesión">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{loggingOut ? 'Saliendo...' : 'Salir'}</span>
        </button>
      </header>
      {logoutError && <p role="alert" className="bg-red-900/30 px-4 py-2 text-center text-xs text-red-200">No se pudo cerrar la sesión. Intentá de nuevo.</p>}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
