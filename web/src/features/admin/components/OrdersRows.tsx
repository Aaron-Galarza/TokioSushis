import { Clock, User, Phone, MapPin, Banknote, CreditCard, Bike, XCircle, Printer, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { generateComandaHTML } from '../utils/generateComandaHTML';

interface ORProps {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, s: string) => void;
}

const SDOT: Record<string, string> = {
  pending:        'bg-yellow-400',
  'in-preparation': 'bg-blue-400',
  ready:          'bg-green-400',
  delivered:      'bg-emerald-500',
  cancelled:      'bg-red-500',
};

const SNX: Record<string, { l: string; v: string }> = {
  pending:          { l: 'Iniciar proceso',  v: 'in-preparation' },
  'in-preparation': { l: 'Marcar listo',     v: 'ready' },
  ready:            { l: 'Entregado',        v: 'delivered' },
};

export function OrderRow({ order, expanded, onToggle, onStatus }: ORProps) {
  const dot   = SDOT[order.status] || 'bg-zinc-600';
  const num   = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  const dt    = new Date(order.createdAt);
  const dateStr = dt.toLocaleDateString('es-AR');
  const timeStr = dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const isDelivery = order.deliveryType === 'delivery';
  const payMethod  = order.paymentMethod;

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

        {/* Dot de estado */}
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dot}`} />

        {/* Info principal — clickeable para expandir */}
        <button className="flex-1 text-left min-w-0" onClick={onToggle}>
          <div className="flex justify-between items-start gap-4">

            {/* Izquierda: nombre, teléfono, hora */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white text-sm font-semibold">{order.customer?.name}</span>
                <span className="text-white/30 text-xs">#{num}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Phone className="w-3 h-3 shrink-0" />
                {order.customer?.phone}
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Clock className="w-3 h-3 shrink-0" />
                {dateStr} — {timeStr}
              </div>
            </div>

            {/* Derecha: total, delivery, pago */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-primary font-bold text-lg leading-none">
                ${order.total?.toLocaleString('es-AR')}
              </span>
              <div className="flex items-center gap-1">
                {isDelivery
                  ? <Bike className="w-3.5 h-3.5 text-blue-400" />
                  : <MapPin className="w-3.5 h-3.5 text-green-400" />}
                <span className="text-xs text-white/40">
                  {isDelivery ? 'Delivery' : 'Retiro'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {payMethod === 'cash'
                  ? <Banknote className="w-3.5 h-3.5 text-yellow-400" />
                  : <CreditCard className="w-3.5 h-3.5 text-purple-400" />}
                <span className="text-xs text-white/40">
                  {payMethod === 'cash' ? 'Efectivo' : payMethod === 'transfer' ? 'Transferencia' : 'Mercado Pago'}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Botones de acción verticales */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); handlePrint(); }}
            className="p-2 rounded-lg bg-[#2A2A2A] hover:bg-primary/20 hover:text-primary text-white/30 transition-all"
            title="Imprimir comanda"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onToggle(); }}
            className="p-2 rounded-lg bg-[#2A2A2A] hover:bg-white/10 text-white/30 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Detalle expandido ── */}
      {expanded && (
        <div className="border-t border-[#2A2A2A] px-4 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">

          {/* Productos */}
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2">Productos</p>
            <div className="space-y-1">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-white">
                      <span className="text-primary font-bold">{item.quantity}×</span> {item.title}
                    </span>
                    <span className="text-white/40 shrink-0 ml-2">
                      ${(item.price * item.quantity)?.toLocaleString('es-AR')}
                    </span>
                  </div>
                  {item.addons?.length > 0 && (
                    <p className="text-[11px] text-white/30 pl-4 mt-0.5">
                      + {item.addons.map((a: any) => `${a.quantity}x ${a.title}`).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dirección */}
          {order.delivery?.address && (
            <div className="flex items-start gap-2 text-sm text-white/40">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              {order.delivery.address}
            </div>
          )}

          {/* Notas */}
          {order.notes && (
            <div className="bg-[#222] rounded-lg px-3 py-2">
              <p className="text-xs text-white/50">📝 {order.notes}</p>
            </div>
          )}

          {/* Cupón */}
          {order.couponCode && (
            <p className="text-green-400 text-xs">
              Cupón: {order.couponCode} (−{order.discountPercent}%)
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap pt-1">
            {order.status !== 'cancelled' && order.status !== 'delivered' && SNX[order.status] && (
              <button
                onClick={() => onStatus(order._id, SNX[order.status].v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm font-semibold transition-all active:scale-95"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {SNX[order.status].l}
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

            {order.status === 'cancelled' && (
              <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">
                Pedido Cancelado
              </span>
            )}
            {order.status === 'delivered' && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">
                Pedido Entregado
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}