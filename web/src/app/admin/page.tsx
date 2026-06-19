'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, DollarSign, CreditCard, Trophy,
  Clock, User, Phone, Printer, MapPin, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import api from '@/services/api';

type Range = 'hoy' | 'ayer' | 'semana' | 'mes';
type StatusFilter = 'pending' | 'in-preparation' | 'completed' | 'cancelled';

interface Analytics {
  total: number;
  efectivo: number;
  trans: number;
  entregados: number;
  topProduct: { title: string; quantity: number } | null;
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-400',
  'in-preparation': 'bg-blue-400',
  ready: 'bg-green-400',
  delivered: 'bg-green-600',
  cancelled: 'bg-red-500',
};

const STATUS_NEXT: Record<string, { label: string; value: string }> = {
  pending: { label: 'Iniciar proceso', value: 'in-preparation' },
  'in-preparation': { label: 'Marcar listo', value: 'ready' },
  ready: { label: 'Entregado', value: 'delivered' },
};

const STATUS_TABS = [
  { key: 'pending' as StatusFilter, label: 'Pendientes', dot: 'bg-yellow-400' },
  { key: 'in-preparation' as StatusFilter, label: 'En Proceso', dot: 'bg-blue-400' },
  { key: 'completed' as StatusFilter, label: 'Terminados', dot: 'bg-green-400' },
  { key: 'cancelled' as StatusFilter, label: 'Cancelados', dot: 'bg-red-500' },
];

export default function AdminOverviewPage() {
  const [range, setRange] = useState<Range>('hoy');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get(`/analytics?range=${range}`);
      setAnalytics(res.data.data);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [range]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/admin/range?range=hoy');
      setOrders(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/orders/admin/${id}`, { status });
    fetchOrders();
  };

  const counts: Record<StatusFilter, number> = {
    pending: orders.filter(o => o.status === 'pending').length,
    'in-preparation': orders.filter(o => o.status === 'in-preparation').length,
    completed: orders.filter(o => o.status === 'ready' || o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'completed') return o.status === 'ready' || o.status === 'delivered';
    return o.status === statusFilter;
  });

  const metrics = analytics ? [
    { icon: TrendingUp, label: 'Ventas Totales', value: `$${analytics.total.toLocaleString('es-AR')}` },
    { icon: DollarSign, label: 'En Efectivo', value: `$${analytics.efectivo.toLocaleString('es-AR')}` },
    { icon: CreditCard, label: 'Transferencia', value: `$${analytics.trans.toLocaleString('es-AR')}` },
    { icon: Trophy, label: 'Producto Estrella', value: analytics.topProduct?.title || '—' },
  ] : [];

  return (
    <div className="flex flex-col gap-5">

      {/* Metrics */}
      <section className="bg-[#161616] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white text-sm">Métricas de Negocio</h2>
          <select
            value={range}
            onChange={e => setRange(e.target.value as Range)}
            className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none"
          >
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.map(m => (
              <div key={m.label} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] text-white/35 mb-2">
                  <m.icon className="w-3.5 h-3.5 text-primary" />
                  {m.label}
                </div>
                <p className="text-lg font-bold text-primary leading-tight">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders Panel */}
      <section className="bg-[#161616] border border-white/10 rounded-2xl p-5">
        <h2 className="font-semibold text-white text-sm mb-4">Panel de Pedidos</h2>

        <div className="flex gap-2 flex-wrap mb-4">
          {STATUS_TABS.map(tab => {
            const count = counts[tab.key];
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-primary text-black'
                    : 'border border-white/15 text-white/40 hover:text-white hover:border-white/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-black/30' : tab.dot}`} />
                {tab.label}
                {count > 0 && (
                  <span className={`ml-0.5 ${isActive ? 'text-black/70' : 'text-white/50'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          {filteredOrders.length === 0 && (
            <p className="text-white/20 text-sm py-8 text-center">Sin pedidos en esta categoría.</p>
          )}
          {filteredOrders.map(order => {
            const isExpanded = expandedId === order._id;
            const dotColor = STATUS_DOT[order.status] || 'bg-zinc-600';
            const orderNum = String(order.orderNumber || order._id?.slice(-4) || '0000').padStart(4, '0');
            const date = new Date(order.createdAt);
            const dateStr = date.toLocaleDateString('es-AR');
            const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            const payLabel = order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'transfer' ? 'Transferencia' : 'Mercado Pago';

            return (
              <div key={order._id} className="py-3.5">
                <div className="flex items-start gap-3">
                  <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

                  <div className="shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white/30" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white text-sm">{order.customer?.name}</span>
                      <span className="text-white/20 text-xs">#{orderNum}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-[11px] mt-0.5">
                      <Phone className="w-2.5 h-2.5" />
                      {order.customer?.phone}
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-[11px] mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {dateStr} — {timeStr}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className="font-bold text-primary">${order.total?.toLocaleString('es-AR')}</span>
                    <button className="text-white/20 hover:text-white/50 transition-colors">
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      order.deliveryType === 'delivery' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'
                    }`}>
                      {order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro'}
                    </span>
                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      {payLabel}
                    </span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      className="text-white/25 hover:text-white/60 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-10 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="flex flex-col gap-1">
                      {order.items?.map((item: any, i: number) => (
                        <p key={i} className="text-xs text-white/50">
                          {item.quantity}x {item.title}
                          {item.addons?.length > 0 && (
                            <span className="text-white/25"> + {item.addons.map((a: any) => a.title).join(', ')}</span>
                          )}
                        </p>
                      ))}
                    </div>
                    {order.delivery?.address && (
                      <div className="flex items-start gap-1.5 text-xs text-white/30">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                        {order.delivery.address}
                      </div>
                    )}
                    {order.couponCode && (
                      <p className="text-green-400 text-xs">Cupón: {order.couponCode} (−{order.discountPercent}%)</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_NEXT[order.status] && (
                        <button
                          onClick={() => updateStatus(order._id, STATUS_NEXT[order.status].value)}
                          className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
                        >
                          → {STATUS_NEXT[order.status].label}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => updateStatus(order._id, 'cancelled')}
                          className="bg-red-900/60 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-900 active:scale-95 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
