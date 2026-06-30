'use client';

import { Clock, User, Phone, MapPin, Banknote, CreditCard, Bike, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { generateComandaHTML } from '../utils/generateComandaHTML';
import { formatWhatsAppLink } from '../utils/whatsappMessage';
import { ORDER_STATUS, STATUS_TRANSITIONS, type OrderStatusKey } from '@/constants/orderStatus';
import { OrderExpandedDetail } from './OrderExpandedDetail';

interface ORProps {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, s: string) => void;
  onRefresh?: () => void;
}

export function OrderRow({ order, expanded, onToggle, onStatus, onRefresh }: ORProps) {
  const status = ORDER_STATUS[order.status as OrderStatusKey] ?? ORDER_STATUS.pending;
  const transition = STATUS_TRANSITIONS[order.status as OrderStatusKey];
  const num = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  const isDelivery = order.deliveryType === 'delivery';

  const handlePrint = () => {
    const htmlContent = generateComandaHTML(order);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) { doc.open(); doc.write(htmlContent); doc.close(); }
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden mb-3 last:mb-0">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 p-4">
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${status.dot}`} />

        <button className="flex-1 text-left min-w-0" onClick={onToggle}>
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white text-sm font-semibold">{order.customer?.name}</span>
                <span className="text-white/30 text-xs">#{num}</span>
                {order.customer?.phone && (
                  <a
                    href={formatWhatsAppLink(order.customer.phone, order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all duration-200 active:scale-95 group font-medium"
                  >
                    <Phone className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 transition-transform group-hover:scale-110" />
                    <span className="hover:underline">{order.customer.phone}</span>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Clock className="w-3 h-3 shrink-0" />
                {new Date(order.createdAt).toLocaleDateString('es-AR')} — {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-primary font-bold text-lg leading-none">${order.total?.toLocaleString('es-AR')}</span>
              <div className="flex items-center gap-1">
                {isDelivery ? <Bike className="w-3.5 h-3.5 text-blue-400" /> : <MapPin className="w-3.5 h-3.5 text-green-400" />}
                <span className="text-xs text-white/40">{isDelivery ? 'Delivery' : 'Retiro'}</span>
              </div>
              <div className="flex items-center gap-1">
                {order.paymentMethod === 'cash' ? <Banknote className="w-3.5 h-3.5 text-emerald-400" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                <span className="text-xs text-white/40">{order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'debito' ? 'Débito' : 'Crédito'}</span>
              </div>
            </div>
          </div>
        </button>

        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); handlePrint(); }} className="p-2 rounded-lg bg-[#2A2A2A] hover:bg-primary/20 hover:text-primary text-white/30 transition-all" title="Imprimir comanda">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); onToggle(); }} className="p-2 rounded-lg bg-[#2A2A2A] hover:bg-white/10 text-white/30 transition-all">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Detalle expandido extraído ── */}
      {expanded && (
        <OrderExpandedDetail
          order={order}
          isDelivery={isDelivery}
          transition={transition}
          onStatus={onStatus}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}