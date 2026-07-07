'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/admin');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/users/login', { email, password });
      const token = res.data?.data?.token || res.data?.token || res.data?.data;

      if (!token || typeof token !== 'string') {
        throw new Error('El backend respondió, pero no se encontró un token válido en la respuesta.');
      }

      login(token);
      setTimeout(() => { router.push('/admin'); }, 150);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.error || err.response.data?.message || 'Credenciales inválidas');
      } else if (err.request) {
        setError('No se pudo conectar con el servidor.');
      } else {
        setError(err.message || 'Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-4">
      <div className="mb-8 text-center">
        <h1 className="font-heading italic text-3xl font-semibold tracking-widest text-primary">
          TOKYO SUSHIS
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/30">Panel de administración</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#161616] border border-white/10 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 text-sm transition-all active:scale-95"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
