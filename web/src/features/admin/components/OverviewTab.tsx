'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, DollarSign, CreditCard, ShoppingBag, Star,
  Clock, Package, CheckCircle, XCircle, Truck,
  AlertCircle, Power, Tag, Percent, Utensils, Bike, MapPin, Loader2,
} from 'lucide-react';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useAdminCoupons } from '../hooks/useAdminCoupons';
import { useAdminMenu } from '../hooks/useAdminMenu';
import { toggleEmergency as apiToggle, fetchConfigStatus } from '@/services/admin.service';
import type { AdminRange } from '@/services/admin.service';

// ── Status config con estados reales de la DB ─────────────────────────────
const STATUS_CFG: Record<string, { label: string; dot: string; badge: string; icon: any }> = {
  pending:          { label: 'Pendiente',  dot: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', icon: Clock },
  'in-preparation': { label: 'En proceso', dot: 'bg-blue-400',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',       icon: Package },
  ready:            { label: 'Listo',      dot: 'bg-green-400',  badge: 'bg-green-500/15 text-green-400 border-green-500/25',    icon: CheckCircle },
  delivered:        { label: 'Entregado',  dot: 'bg-emerald-400',badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', icon: Truck },
  cancelled:        { label: 'Cancelado',  dot: 'bg-red-400',    badge: 'bg-red-500/15 text-red-400 border-red-500/25',          icon: XCircle },
};

// Paleta de colores para categorías dinámicas — cicla si hay más de 6
const CAT_PALETTE = [
  'bg-primary/15 text-primary border-primary/25',
  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'bg-teal-500/15 text-teal-400 border-teal-500/25',
];

const RANGES: { v: AdminRange; l: string }[] = [
  { v: 'hoy',    l: 'Hoy' },
  { v: 'ayer',   l: 'Ayer' },
  { v: 'semana', l: 'Esta semana' },
  { v: 'mes',    l: 'Este mes' },
];

export function OverviewTab() {
  const overview  = useAdminOverview();
  const ordersHook = useAdminOrders();
  const coupons   = useAdminCoupons();
  const menu      = useAdminMenu();
  const [emergency, setEmergency] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([overview.reload(), coupons.reload(), menu.reload()]);
    try {
      const c = await fetchConfigStatus();
      setEmergency(c.isEmergencyClosed ?? false);
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAll(); }, [loadAll]);

  // Mapa de categoría → color (construido una vez desde las cats reales)
  const catColorMap: Record<string, string> = {};
  menu.cats.forEach((cat: any, i: number) => {
    catColorMap[cat._id] = CAT_PALETTE[i % CAT_PALETTE.length];
    catColorMap[cat.name] = CAT_PALETTE[i % CAT_PALETTE.length];
  });

  // Últimos 6 pedidos del día
  const recentOrders = ordersHook.orders.slice(0, 6);

  // Solo productos activos
  const activeProducts = menu.products.filter((p: any) => p.active);

  // Todos los cupones (activos e inactivos para contexto)
  const allCoupons = coupons.coupons ?? [];

  const a = overview.analytics;

  return (
    <div className="space-y-4">

      {/* ── 1. Métricas de Negocio ─────────────────────────────────────────── */}
      <section className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/30 uppercase tracking-widest">Métricas de Negocio</span>
          <select
            value={overview.aRange}
            onChange={e => overview.changeRange(e.target.value as AdminRange)}
            className="bg-[#0A0A0A] text-white text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-primary/50"
          >
            {RANGES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </div>

        {overview.aLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : a && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: TrendingUp,  label: 'Ventas Totales',   value: `$${(a.total ?? 0).toLocaleString('es-AR')}` },
              { icon: DollarSign,  label: 'Efectivo',         value: `$${(a.efectivo ?? 0).toLocaleString('es-AR')}` },
              { icon: CreditCard,  label: 'Transferencia',    value: `$${(a.trans ?? 0).toLocaleString('es-AR')}` },
              { icon: ShoppingBag, label: 'Pedidos',          value: String(a.entregados ?? 0) },
              { icon: Star,        label: 'Más Vendido',      value: a.topProduct?.title || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#0A0A0A] rounded-lg p-3 border border-[#2A2A2A] flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span className="text-white/30 text-xs truncate">{label}</span>
                </div>
                <p className="text-sm font-semibold truncate text-primary">{value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Pedidos Recientes ───────────────────────────────────────────── */}
      <section className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/30 uppercase tracking-widest">Pedidos Recientes</span>
          <div className="flex items-center gap-3">
            {(['pending', 'in-preparation', 'ready'] as const).map(s => (
              <span key={s} className="flex items-center gap-1 text-xs text-white/30">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[s].dot}`} />
                {STATUS_CFG[s].label}
              </span>
            ))}
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-6">Sin pedidos hoy.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order: any) => {
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG['pending'];
              const Icon = cfg.icon;
              const num = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
              const dt = new Date(order.createdAt);
              const time = dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={order._id} className="flex items-center gap-3 bg-[#0A0A0A] rounded-lg px-3 py-2.5 border border-[#2A2A2A]">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{order.customer?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span className="text-white/30 text-xs">{time}</span>
                      <span className="text-white/30 text-xs">· #{num}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {order.deliveryType === 'delivery'
                      ? <Bike className="w-3.5 h-3.5 text-blue-400" />
                      : <MapPin className="w-3.5 h-3.5 text-white/30" />}
                    <span className="text-primary text-sm">${(order.total ?? 0).toLocaleString('es-AR')}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${cfg.badge}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. Productos Activos + Cupones ────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Productos Activos */}
        <section className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/30 uppercase tracking-widest">Productos Activos</span>
            <span className="text-xs text-white/30 bg-[#0A0A0A] border border-[#2A2A2A] px-2 py-0.5 rounded-full">
              {activeProducts.length} productos
            </span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto overscroll-contain scrollbar-none">
            {activeProducts.map((p: any) => {
              const catName = typeof p.category === 'object' ? p.category?.name : (menu.cats.find((c: any) => c._id === p.category)?.name ?? '');
              const color = catColorMap[catName] ?? CAT_PALETTE[0];
              return (
                <div key={p._id} className="flex items-center gap-3 bg-[#0A0A0A] rounded-lg px-3 py-2 border border-[#2A2A2A]">
                  <Utensils className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <span className="text-white text-sm flex-1 truncate">{p.title}</span>
                  {catName && (
                    <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${color}`}>
                      {catName}
                    </span>
                  )}
                  <span className="text-primary text-sm shrink-0">${p.price?.toLocaleString('es-AR')}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cupones */}
        <section className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/30 uppercase tracking-widest">Cupones Activos</span>
            <span className="text-xs text-white/30 bg-[#0A0A0A] border border-[#2A2A2A] px-2 py-0.5 rounded-full">
              {allCoupons.filter((c: any) => c.active).length} activos
            </span>
          </div>
          <div className="space-y-2">
            {allCoupons.map((c: any) => (
              <div
                key={c._id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                  c.active ? 'bg-[#0A0A0A] border-[#2A2A2A]' : 'bg-[#0A0A0A]/50 border-[#1A1A1A] opacity-50'
                }`}
              >
                <Tag className={`w-3.5 h-3.5 shrink-0 ${c.active ? 'text-primary' : 'text-white/20'}`} />
                <span className="text-white text-sm font-mono flex-1">{c.code}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-primary text-sm">
                    <Percent className="w-3 h-3" />
                    {c.discountPercent ? `${c.discountPercent}%` : `$${c.discountAmount?.toLocaleString('es-AR')}`}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    c.active
                      ? 'bg-green-500/15 text-green-400 border-green-500/25'
                      : 'bg-[#2A2A2A] text-white/30 border-[#333]'
                  }`}>
                    {c.active ? 'Activo' : 'Inactivo'}
                  </span>
                  {c.expiresAt && (
                    <span className="text-white/25 text-xs hidden sm:block">
                      {new Date(c.expiresAt).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── 4. Botón de Pánico ────────────────────────────────────────────── */}
      <section className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-semibold">Botón de Pánico</p>
              <p className="text-white/30 text-xs mt-0.5">
                Anula los horarios normales e {emergency ? 'reabre' : 'interrumpe'} la recepción de pedidos de forma inmediata.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${emergency ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-xs text-white/50 uppercase tracking-wide whitespace-nowrap">
                {emergency ? 'CIERRE ACTIVO' : 'OPERANDO'}
              </span>
            </div>
            <button
              onClick={async () => setEmergency(await apiToggle())}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                emergency
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              {emergency ? 'Reabrir Local' : 'Cerrar de Emergencia'}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}