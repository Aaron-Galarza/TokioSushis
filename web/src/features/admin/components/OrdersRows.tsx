import { Clock, User, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface ORProps {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, s: string) => void;
}

const SDOT: Record<string, string> = { 
  pending: 'bg-yellow-400', 
  'in-preparation': 'bg-blue-400', 
  ready: 'bg-green-400', 
  delivered: 'bg-green-600', 
  cancelled: 'bg-red-500' 
};

const SNX: Record<string, { l: string; v: string }> = {
  pending: { l: 'Iniciar', v: 'in-preparation' },
  'in-preparation': { l: 'Marcar listo', v: 'ready' },
  ready: { l: 'Entregado', v: 'delivered' },
};

export function OrderRow({ order, expanded, onToggle, onStatus }: ORProps) {
  const dot = SDOT[order.status] || 'bg-zinc-600';
  const num = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  const dt = new Date(order.createdAt);
  const payL = order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'transfer' ? 'Transferencia' : 'Mercado Pago';

  return (
    <div className="py-3.5 border-b border-white/5 last:border-0">
      <div className="flex items-start gap-3">
        <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <div className="shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white text-sm">{order.customer?.name}</span>
            <span className="text-white/20 text-xs">#{num}</span>
          </div>
          <div className="flex items-center gap-3 text-white/30 text-[11px] mt-0.5 flex-wrap">
            <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5"/>{order.customer?.phone}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5"/>
              {dt.toLocaleDateString('es-AR')} {dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className="font-bold text-primary text-sm">${order.total?.toLocaleString('es-AR')}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.deliveryType === 'delivery' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
            {order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro'}
          </span>
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{payL}</span>
          <button onClick={onToggle} className="text-white/25 hover:text-white/60 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 ml-10 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            {order.items?.map((item: any, i: number) => (
              <p key={i} className="text-xs text-white/50">
                {item.quantity}x {item.title}
                {item.addons?.length > 0 && <span className="text-white/25"> + {item.addons.map((a: any) => a.title).join(', ')}</span>}
              </p>
            ))}
          </div>
          {order.delivery?.address && (
            <div className="flex items-start gap-1.5 text-xs text-white/30">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary"/>
              {order.delivery.address}
            </div>
          )}
          {order.couponCode && <p className="text-green-400 text-xs">Cupón: {order.couponCode} (−{order.discountPercent}%)</p>}
          <div className="flex gap-2 flex-wrap">
            {SNX[order.status] && (
              <button onClick={() => onStatus(order._id, SNX[order.status].v)}
                className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all">
                → {SNX[order.status].l}
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button onClick={() => onStatus(order._id, 'cancelled')}
                className="bg-red-900/60 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-900 active:scale-95 transition-all">
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}