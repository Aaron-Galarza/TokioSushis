'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import axios from 'axios';
import api from '@/services/api';

export default function InvitePage() {
  const token = useSyncExternalStore(
    (callback) => { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback); },
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '',
    () => '',
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      await api.post('/users/accept-invite', { token, password });
      setDone(true);
      setPassword(''); setConfirm('');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error || 'No se pudo activar la cuenta.' : 'No se pudo activar la cuenta.');
    } finally { setBusy(false); }
  };

  return <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-14 text-white">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Tokyo Sushis / Equipo</p>
    <h1 className="mt-3 font-heading text-3xl font-semibold">Activar mi cuenta</h1>
    {done ? <div className="mt-7 rounded-2xl border border-primary/30 bg-primary/10 p-6"><p>Tu cuenta ya está activa.</p><Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-black">Ir al ingreso</Link></div>
      : !token ? <p className="mt-6 rounded-xl border border-white/10 p-5 text-sm text-white/60">El enlace de invitación no es válido. Pedile uno nuevo al Owner.</p>
      : <form onSubmit={submit} className="mt-7 space-y-5 rounded-2xl border border-white/10 bg-[#151515] p-6">
        <p className="text-sm leading-relaxed text-white/55">Elegí una contraseña de al menos 12 caracteres. El enlace se usa una sola vez.</p>
        {error && <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <label className="block text-sm text-white/70">Contraseña<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-3 text-white focus-visible:outline-2 focus-visible:outline-primary" /></label>
        <label className="block text-sm text-white/70">Repetir contraseña<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-[#1b1b1b] px-3 text-white focus-visible:outline-2 focus-visible:outline-primary" /></label>
        <button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl bg-primary px-5 text-sm font-bold text-black disabled:opacity-50">{busy ? 'Activando…' : 'Activar cuenta'}</button>
      </form>}
  </div>;
}
