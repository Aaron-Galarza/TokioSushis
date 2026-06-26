import { Clock, User, Phone, MapPin, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { generateComandaHTML } from '../utils/generateComandaHTML';

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

  // 🖨️ TRUCO DEL IFRAME: Abre el cuadro de diálogo de la impresora de manera aislada sin romper la UI
  const handlePrint = () => {
    const htmlContent = generateComandaHTML(order);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  };

  return (
    <div className="py-3.5 border-b border-white/5 last:border-0 relative">
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
        <div className="mt-3 ml-10 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="text-xs text-white/70 py-0.5">
                <span className="font-bold text-primary">{item.quantity}x</span> {item.title}
                {item.addons?.length > 0 && (
                  <span className="text-white/30 block pl-3 text-[11px]">
                    + {item.addons.map((a: any) => `${a.quantity}x ${a.title}`).join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {order.delivery?.address && (
            <div className="flex items-start gap-1.5 text-xs text-white/40">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary"/>
              {order.delivery.address}
            </div>
          )}

          {order.notes && (
            <p className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg">
              <strong>Notas:</strong> {order.notes}
            </p>
          )}

          {order.couponCode && (
            <p className="text-green-400 text-xs">Cupón: {order.couponCode} (−{order.discountPercent}%)</p>
          )}

          <div className="flex gap-2 flex-wrap pt-1 w-full items-center">
            {/* 🛑 BLINDAJE CRÍTICO: Si el pedido está CANCELADO o ENTREGADO, no mostramos flujos de avance */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && SNX[order.status] && (
              <button onClick={() => onStatus(order._id, SNX[order.status].v)}
                className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all">
                → {SNX[order.status].l}
              </button>
            )}

            <button 
              onClick={handlePrint}
              className="bg-zinc-800 text-white/80 border border-white/10 hover:bg-zinc-700 active:scale-95 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Comanda
            </button>

            {/* Solo se puede cancelar si no está cancelado ni entregado ya */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button onClick={() => onStatus(order._id, 'cancelled')}
                className="bg-red-900/40 text-red-300 border border-red-500/10 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-900/70 active:scale-95 transition-all ml-auto">
                Cancelar Pedido
              </button>
            )}

            {/* Tag visual explícito de fin de ciclo */}
            {order.status === 'cancelled' && (
              <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">
                Pedido Cancelado Permanente
              </span>
            )}
            {order.status === 'delivered' && (
              <span className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">
                Pedido Entregado
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}