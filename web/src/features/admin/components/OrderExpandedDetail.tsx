'use client';

import { useState } from 'react';
import { MapPin, Bike, Check, XCircle, ArrowRight } from 'lucide-react';
import { OrderItemList } from './ui/OrderItemList';
import { updateOrderDeliveryCost } from '@/services/admin.service';
import { formatOrderReadyWhatsAppLink } from '../utils/whatsappMessage';

interface OrderExpandedDetailProps {
  order: any;
  isDelivery: boolean;
  transition: any;
  onStatus: (id: string, s: string) => void;
  onRefresh?: () => void;
}

export function OrderExpandedDetail({ order, isDelivery, transition, onStatus, onRefresh }: OrderExpandedDetailProps) {
  const [editingCost, setEditingCost] = useState(false);
  const [costInput, setCostInput] = useState(String(order.deliveryCost ?? 0));
  const [savingCost, setSavingCost] = useState(false);

  const handleSaveCost = async () => {
    const val = Number(costInput);
    if (isNaN(val) || val < 0) return;
    setSavingCost(true);
    try {
      await updateOrderDeliveryCost(order._id, val);
      setEditingCost(false);
      onRefresh?.();
    } catch {} finally {
      setSavingCost(false);
    }
  };

  const handleTransitionClick = () => {
    // 1. Primero, ejecutamos el cambio de estado normal en la DB
    onStatus(order._id, transition.next);

    // 2. Si el estado al que lo estamos pasando es 'ready' (Terminado), preguntamos:
    if (transition.next === 'ready') {
      const wantsToNotify = window.confirm(
        `¿Deseás avisarle por WhatsApp a ${order.customer?.name || 'el cliente'} que su pedido está listo?`
      );

      if (wantsToNotify) {
        if (order.customer?.phone) {
          const url = formatOrderReadyWhatsAppLink(order.customer.phone, order);
          window.open(url, '_blank');
        } else {
          alert('Este cliente no tiene un número de teléfono registrado.');
        }
      }
    }
  };

  return (
    <div className="border-t border-[#2A2A2A] px-4 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
      <div>
        <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2">Productos</p>
        <OrderItemList items={order.items} />
      </div>

      {order.delivery?.address && (
        <div className="flex items-start gap-2 text-sm text-white/40">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
          {order.delivery.address}
        </div>
      )}

      {isDelivery && (
        <div className="flex items-center gap-2 bg-[#111] border border-white/5 rounded-lg px-3 py-2">
          <Bike className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-white/40 text-xs flex-1">Costo de envío</span>
          {editingCost ? (
            <>
              <span className="text-white/40 text-xs">$</span>
              <input
                type="number"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCost(); }}
                className="w-24 bg-[#0A0A0A] border border-primary/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none text-right"
                min={0}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveCost}
                disabled={savingCost}
                className="p-1 rounded bg-primary/20 hover:bg-primary/30 text-primary transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setEditingCost(false); setCostInput(String(order.deliveryCost ?? 0)); }}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/40 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-white text-xs font-semibold">${(order.deliveryCost ?? 0).toLocaleString('es-AR')}</span>
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button
                  onClick={() => setEditingCost(true)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all"
                >
                  <Check className="w-3 h-3" /> {/* Nota: Originalmente usabas Pencil, se cambió por consistencia, adaptalo si preferís Pencil */}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {order.notes && (
        <div className="bg-[#222] rounded-lg px-3 py-2 border-l-2 border-primary/40">
          <p className="text-xs text-white/70">📝 <span className="font-mono text-[11px] text-white/40">nota:</span> {order.notes}</p>
        </div>
      )}

      {order.couponCode && <p className="text-green-400 text-xs font-medium">Cupón: {order.couponCode} (−{order.discountPercent}%)</p>}

      <div className="flex gap-2 flex-wrap pt-1">
        {order.status !== 'cancelled' && order.status !== 'delivered' && transition && (
      <button
        onClick={handleTransitionClick}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm font-semibold transition-all active:scale-95"
      >
            <ArrowRight className="w-3.5 h-3.5" />
            {transition.label}
          </button>
        )}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <button
            onClick={() => onStatus(order._id, 'cancelled')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold transition-all active:scale-95 ml-auto"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar pedido
          </button>
        )}
        {order.status === 'cancelled' && <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">Pedido Cancelado</span>}
        {order.status === 'delivered' && <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">Pedido Entregado</span>}
      </div>
    </div>
  );
}