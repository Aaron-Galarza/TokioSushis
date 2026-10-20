'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

type Overview = {
  branches: { id: string; name: string }[];
  totals: { orders: number; delivered: number; revenue: number };
  byBranch: { id: string; name: string; orders: number; delivered: number; revenue: number }[];
  recentOrders: { _id: string; branchName: string; status: string; total: number; createdAt: string }[];
};

export default function OwnerPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [data, setData] = useState<Overview | null>(null);
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me').then((res) => {
      if (res.data.data?.role !== 'owner') router.replace('/login');
    }).catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    api.get('/owner/overview', { params: branchId ? { branchId } : {} })
      .then((res) => { setData(res.data.data); setError(''); })
      .catch(() => setError('No se pudo cargar el resumen.'));
  }, [branchId]);

  const money = (value: number) => `$${value.toLocaleString('es-AR')}`;
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-white">
    <header className="flex items-center justify-between gap-4">
      <div><h1 className="font-heading text-2xl text-primary">Resumen de sucursales</h1>
        <p className="text-sm text-white/50">Pedidos y ventas entregadas</p></div>
      <button className="text-sm text-white/50 hover:text-white" onClick={() => { logout(); router.replace('/login'); }}>Salir</button>
    </header>
    <label className="block text-sm">Sucursal
      <select value={branchId} onChange={(event) => setBranchId(event.target.value)}
        className="mt-2 block rounded-lg border border-white/20 bg-zinc-900 p-2">
        <option value="">Todas las sucursales</option>
        {data?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
      </select>
    </label>
    {error && <p className="text-red-400">{error}</p>}
    {data && <>
      <section className="grid gap-3 sm:grid-cols-3">
        {([['Pedidos', data.totals.orders], ['Entregados', data.totals.delivered], ['Ventas entregadas', money(data.totals.revenue)]] as const)
          .map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/50">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p>
          </div>)}
      </section>
      <section><h2 className="mb-3 font-semibold">Por sucursal</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/60"><tr><th className="p-3">Sucursal</th><th className="p-3">Pedidos</th><th className="p-3">Entregados</th><th className="p-3">Ventas</th></tr></thead>
          <tbody>{data.byBranch.map((branch) => <tr key={branch.id} className="border-t border-white/10">
            <td className="p-3">{branch.name}</td><td className="p-3">{branch.orders}</td><td className="p-3">{branch.delivered}</td><td className="p-3">{money(branch.revenue)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
      <section><h2 className="mb-3 font-semibold">Últimos pedidos</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/60"><tr><th className="p-3">Sucursal</th><th className="p-3">Fecha</th><th className="p-3">Estado</th><th className="p-3">Total</th></tr></thead>
          <tbody>{data.recentOrders.map((order) => <tr key={order._id} className="border-t border-white/10">
            <td className="p-3">{order.branchName}</td><td className="p-3">{new Date(order.createdAt).toLocaleString('es-AR')}</td><td className="p-3">{order.status}</td><td className="p-3">{money(order.total)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </>}
  </main>;
}
