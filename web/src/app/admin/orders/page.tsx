'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

type Status = 'pending' | 'in-preparation' | 'ready' | 'delivered' | 'cancelled';
type Range = 'hoy' | 'ayer' | 'semana' | 'mes';

const STATUS_LABEL: Record<string, string> = {
  'pending': 'Pendiente',
  'in-preparation': 'En preparación',
  'ready': 'Listo',
  'delivered': 'Entregado',
  'cancelled': 'Cancelado',
};

const STATUS_NEXT: Partial<Record<Status, Status>> = {
  'pending': 'in-preparation',
  'in-preparation': 'ready',
  'ready': 'delivered',
};

const STATUS_COLOR: Record<string, string> = {
  'pending': 'bg-zinc-700 text-white/60',
  'in-preparation': 'bg-yellow-900 text-yellow-300',
  'ready': 'bg-blue-900 text-blue-300',
  'delivered': 'bg-green-900 text-green-300',
  'cancelled': 'bg-red-900 text-red-300',
};

const RANGES: Range[] = ['hoy', 'ayer', 'semana', 'mes'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [range, setRange] = useState<Range>('hoy');
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/admin/range?range=${range}`);
      setOrders(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: Status) => {
    await api.put(`/orders/admin/${id}`, { status });
    fetchOrders();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
          {loading && <span className="text-white/30 text-xs">actualizando...</span>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${range === r ? 'bg-primary text-black' : 'bg-[#1A1A1A] border border-white/10 text-white/60 hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!loading && orders.length === 0 && (
        <p className="text-white/40 text-sm">Sin pedidos en este rango.</p>
      )}

      <div className="flex flex-col gap-3">
        {orders.map(order => (
          <div key={order._id} className="bg-[#161616] border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-white">
                  {order.customer?.name} — {order.customer?.phone}
                </p>
                <p className="text-white/40 text-xs">
                  {new Date(order.createdAt).toLocaleString('es-AR')} · {order.deliveryType} · {order.paymentMethod}
                </p>
                {order.delivery?.address && (
                  <p className="text-white/50 text-xs mt-0.5">{order.delivery.address}</p>
                )}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[order.status] || 'bg-zinc-700 text-white/60'}`}>
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>

            <div className="text-sm text-white/60 mb-3 flex flex-col gap-0.5">
              {order.items?.map((item: any, i: number) => (
                <div key={i}>
                  {item.quantity}x {item.title}
                  {item.addons?.length > 0 && ` + ${item.addons.map((a: any) => a.title).join(', ')}`}
                </div>
              ))}
            </div>

            {order.couponCode && (
              <p className="text-green-400 text-xs mb-2">
                Cupón: {order.couponCode} (−{order.discountPercent}%)
              </p>
            )}

            <div className="flex items-center justify-between">
              <p className="font-bold text-primary">${order.total?.toLocaleString('es-AR')}</p>
              <div className="flex gap-2 flex-wrap justify-end">
                {STATUS_NEXT[order.status as Status] && (
                  <button
                    onClick={() => updateStatus(order._id, STATUS_NEXT[order.status as Status]!)}
                    className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90"
                  >
                    → {STATUS_LABEL[STATUS_NEXT[order.status as Status]!]}
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => updateStatus(order._id, 'cancelled')}
                    className="bg-red-900 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-800"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
