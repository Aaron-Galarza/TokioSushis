'use client';

import { useEffect, useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('american-way-auth-storage');
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'No se pudo iniciar sesión');
        return;
      }
      window.location.replace('/admin');
    } catch {
      setError('No se pudo conectar con el servidor. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-4">
      <div className="mb-8 text-center">
        <h1 className="font-heading italic text-3xl font-semibold tracking-widest text-primary">TOKYO SUSHIS</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/30">Panel de administración</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-[#161616] border border-white/10 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        {error && <p role="alert" className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">{error}</p>}
        <div className="flex flex-col gap-3">
          <label htmlFor="admin-email" className="sr-only">Email</label>
          <input id="admin-email" type="email" autoComplete="username" placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors" />
          <label htmlFor="admin-password" className="sr-only">Contraseña</label>
          <input id="admin-password" type="password" autoComplete="current-password" placeholder="Contraseña" value={password} onChange={event => setPassword(event.target.value)} required className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors" />
        </div>
        <button type="submit" disabled={loading} className="bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 text-sm transition-all active:scale-95">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
