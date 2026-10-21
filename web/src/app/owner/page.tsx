'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Clock3, CreditCard, LogOut, PackageCheck, RefreshCw, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

type Range = '7d' | '30d' | '90d';
type CountRevenue = { orders: number; revenue: number };
type Overview = {
  generatedAt: string;
  range: Range;
  timezone: string;
  branches: { id: string; name: string; active: boolean }[];
  totals: { orders: number; delivered: number; revenue: number; averageTicket: number };
  byBranch: { id: string; name: string; orders: number; delivered: number; revenue: number }[];
  statuses: { status: string; orders: number }[];
  daily: ({ date: string } & CountRevenue)[];
  hourly: ({ hour: number } & CountRevenue)[];
  topProducts: { productId: string; title: string; quantity: number }[];
  payments: ({ method: string } & CountRevenue)[];
  deliveryModes: ({ mode: string } & CountRevenue)[];
  recentOrders: { _id: string; branchName: string; status: string; total: number; createdAt: string }[];
};

const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '7 días' }, { key: '30d', label: '30 días' }, { key: '90d', label: '90 días' },
];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', 'in-preparation': 'En preparación', ready: 'Listo',
  delivered: 'Entregado', cancelled: 'Cancelado',
};
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo', debito: 'Débito', credito: 'Crédito', transferencia: 'Transferencia',
};
const money = (value: number) => `$${Math.round(value).toLocaleString('es-AR')}`;
const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

function StatCard({ label, value, detail, icon: Icon }: {
  label: string; value: string; detail: string; icon: typeof TrendingUp;
}) {
  return <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-white/55">{label}</p>
      <span className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span>
    </div>
    <p className="mt-4 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
    <p className="mt-1 text-xs text-white/40">{detail}</p>
  </div>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">{text}</p>;
}

export default function OwnerPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [branchId, setBranchId] = useState('');
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get('/users/me').then((res) => {
      if (res.data.data?.role === 'owner') setAuthorized(true);
      else router.replace('/login');
    }).catch(() => router.replace('/login'));
  }, [router]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    setLoading(true);
    api.get('/owner/overview', { params: { range, ...(branchId ? { branchId } : {}) } })
      .then((res) => { if (!cancelled) { setData(res.data.data); setError(''); } })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el resumen. Intentá actualizarlo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authorized, branchId, range, refreshKey]);

  useEffect(() => {
    if (!authorized) return;
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [authorized, refresh]);

  const chartDays = useMemo(() => data?.daily.slice(-14) ?? [], [data]);
  const peakHours = useMemo(() => [...(data?.hourly ?? [])]
    .sort((a, b) => b.orders - a.orders || a.hour - b.hour).slice(0, 5), [data]);
  const topProducts = data?.topProducts ?? [];
  const maxDaily = Math.max(1, ...chartDays.map((day) => day.revenue));
  const maxHour = Math.max(1, ...peakHours.map((hour) => hour.orders));
  const maxProduct = Math.max(1, ...topProducts.map((product) => product.quantity));
  const totalPayments = (data?.payments ?? []).reduce((sum, row) => sum + row.revenue, 0);

  if (!authorized) return <main className="flex min-h-screen items-center justify-center bg-[#090909] text-sm text-white/50">Verificando acceso…</main>;

  return <main className="min-h-screen bg-[#090909] text-white">
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-6">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Tokyo Sushis / Dirección</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Panorama del negocio</h1>
          <p className="mt-2 text-sm text-white/50">Ventas, demanda y productos de todas tus sucursales.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} aria-label="Actualizar métricas" title="Actualizar métricas"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white/65 transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          <button onClick={() => { logout(); router.replace('/login'); }}
            className="flex h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-medium text-white/50">Sucursal
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)}
              className="mt-2 block h-11 min-w-52 rounded-xl border border-white/15 bg-[#171717] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-primary">
              <option value="">Todas las sucursales</option>
              {data?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <div aria-label="Período" className="flex h-11 items-center gap-1 rounded-xl border border-white/15 bg-[#171717] p-1">
            {RANGES.map(({ key, label }) => <button key={key} onClick={() => setRange(key)} aria-pressed={range === key}
              className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${range === key ? 'bg-primary text-black' : 'text-white/55 hover:text-white'}`}>
              {label}
            </button>)}
          </div>
        </div>
        <p className="text-xs text-white/40" aria-live="polite">
          {loading ? 'Actualizando…' : data ? `Actualizado ${new Date(data.generatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
      {!data && loading && <div className="rounded-2xl border border-white/10 bg-[#151515] p-10 text-center text-sm text-white/50">Cargando métricas…</div>}

      {data && <div className={`space-y-7 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`} aria-busy={loading}>
        <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Ventas entregadas" value={money(data.totals.revenue)} detail="Importe cobrado en pedidos entregados" icon={TrendingUp} />
          <StatCard label="Ticket promedio" value={money(data.totals.averageTicket)} detail="Por pedido entregado" icon={Wallet} />
          <StatCard label="Pedidos recibidos" value={data.totals.orders.toLocaleString('es-AR')} detail="Todos los estados del período" icon={ShoppingBag} />
          <StatCard label="Entregados" value={data.totals.delivered.toLocaleString('es-AR')} detail={`${data.totals.orders ? Math.round(data.totals.delivered / data.totals.orders * 100) : 0}% de los pedidos recibidos`} icon={PackageCheck} />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Tendencia</p>
                <h2 className="mt-1 font-heading text-lg">Ventas por día</h2></div>
              <span className="text-xs text-white/40">Últimos {chartDays.length} días</span>
            </div>
            <div className="mt-7 flex h-48 items-end gap-1.5 border-b border-white/10 pb-2 sm:gap-2" role="group" aria-label="Ventas diarias">
              {chartDays.map((day) => <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2" tabIndex={0}
                aria-label={`${dayLabel(day.date)}: ${money(day.revenue)}, ${day.orders} pedidos entregados`}>
                <div className="flex h-full items-end rounded-t-md bg-white/[0.03]">
                  <div className="w-full rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary group-focus:bg-primary"
                    style={{ height: `${day.revenue ? Math.max(5, day.revenue / maxDaily * 100) : 0}%` }} />
                </div>
                <span className="truncate text-center text-[10px] text-white/40">{dayLabel(day.date)}</span>
              </div>)}
            </div>
            <p className="mt-4 text-xs text-white/40">Solo los pedidos entregados suman ventas. Fechas en {data.timezone.replaceAll('_', ' ')}.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Demanda</p>
            <h2 className="mt-1 font-heading text-lg">Horas de mayor movimiento</h2>
            <p className="mt-1 text-xs text-white/40">Hora en que se creó el pedido entregado</p>
            <div className="mt-6 space-y-4">
              {peakHours.length ? peakHours.map((hour) => <div key={hour.hour}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{String(hour.hour).padStart(2, '0')}:00</span>
                  <span className="text-white/50">{hour.orders} pedidos</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${hour.orders / maxHour * 100}%` }} /></div>
              </div>) : <Empty text="Todavía no hay horarios con ventas entregadas." />}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Menú</p>
              <h2 className="mt-1 font-heading text-lg">Productos más pedidos</h2></div><ArrowUpRight className="h-5 w-5 text-primary" aria-hidden="true" /></div>
            <p className="mt-1 text-xs text-white/40">Unidades en pedidos entregados</p>
            <div className="mt-5 space-y-4">{topProducts.length ? topProducts.map((product, index) => <div key={`${product.productId}:${product.title}`}>
              <div className="mb-1.5 flex items-center gap-3 text-sm"><span className="w-5 text-xs text-white/30">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1 truncate">{product.title}</span><span className="font-semibold text-primary">{product.quantity} u.</span></div>
              <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary/75" style={{ width: `${product.quantity / maxProduct * 100}%` }} /></div>
            </div>) : <Empty text="Todavía no hay productos vendidos en este período." />}</div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Composición</p>
            <h2 className="mt-1 font-heading text-lg">Cómo se cobra</h2>
            <p className="mt-1 text-xs text-white/40">Ventas entregadas por medio de pago</p>
            <div className="mt-5 space-y-4">{data.payments.length ? [...data.payments].sort((a, b) => b.revenue - a.revenue).map((payment) => <div key={payment.method}>
              <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />{PAYMENT_LABELS[payment.method] ?? payment.method}</span>
                <span className="font-semibold">{money(payment.revenue)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary/75" style={{ width: `${totalPayments ? payment.revenue / totalPayments * 100 : 0}%` }} /></div>
            </div>) : <Empty text="Todavía no hay cobros de pedidos entregados." />}</div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Sucursales</p>
            <h2 className="mt-1 font-heading text-lg">Desempeño por local</h2></div><p className="text-xs text-white/40">Pedidos y ventas del período</p></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">{data.byBranch.map((branch) => <div key={branch.id} className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
            <p className="text-sm font-semibold">{branch.name}</p>
            <p className="mt-3 font-heading text-xl font-semibold text-primary">{money(branch.revenue)}</p>
            <p className="mt-1 text-xs text-white/45">{branch.delivered} entregados · {branch.orders} pedidos</p>
          </div>)}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Distribución de pedidos">
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Flujo</p>
            <h2 className="mt-1 font-heading text-lg">Estado de pedidos</h2>
            <div className="mt-5 flex flex-wrap gap-2">{data.statuses.length ? data.statuses.map((entry) => <span key={entry.status}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              {STATUS_LABELS[entry.status] ?? entry.status} <strong className="ml-1 text-white">{entry.orders}</strong>
            </span>) : <span className="text-sm text-white/40">Sin pedidos en el período.</span>}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Entrega</p>
            <h2 className="mt-1 font-heading text-lg">Retiro y envío</h2>
            <p className="mt-1 text-xs text-white/40">Entre los pedidos entregados</p>
            <div className="mt-5 grid grid-cols-2 gap-3">{(['pickup', 'delivery'] as const).map((mode) => {
              const row = data.deliveryModes.find((entry) => entry.mode === mode);
              return <div key={mode} className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
                <p className="text-xs text-white/50">{mode === 'pickup' ? 'Retiro' : 'Envío'}</p>
                <p className="mt-2 font-heading text-xl font-semibold">{row?.orders ?? 0}</p>
                <p className="mt-1 text-xs text-primary">{money(row?.revenue ?? 0)}</p>
              </div>;
            })}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Actividad reciente</p>
            <h2 className="mt-1 font-heading text-lg">Últimos pedidos</h2></div><p className="text-xs text-white/40">Mostramos solo 8, para mantener el foco en las métricas</p></div>
          {data.recentOrders.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-white/10 text-xs text-white/40"><th scope="col" className="pb-3 font-medium">Sucursal</th><th scope="col" className="pb-3 font-medium">Fecha</th>
              <th scope="col" className="pb-3 font-medium">Estado</th><th scope="col" className="pb-3 text-right font-medium">Total</th></tr></thead>
            <tbody>{data.recentOrders.map((order) => <tr key={order._id} className="border-b border-white/[0.06] last:border-0">
              <td className="py-3 font-medium">{order.branchName}</td>
              <td className="py-3 text-white/55">{new Date(order.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td className="py-3"><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">{STATUS_LABELS[order.status] ?? order.status}</span></td>
              <td className="py-3 text-right font-semibold">{money(order.total)}</td>
            </tr>)}</tbody>
          </table></div> : <div className="mt-5"><Empty text="Todavía no hay pedidos en este período." /></div>}
        </section>
        <p className="flex items-center gap-2 pb-4 text-xs text-white/35"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Las métricas se calculan con los pedidos guardados en la base de datos y se actualizan automáticamente.</p>
      </div>}
    </div>
  </main>;
}
