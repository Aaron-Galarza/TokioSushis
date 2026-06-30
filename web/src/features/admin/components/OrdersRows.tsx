import { useState } from 'react';
import { Clock, User, Phone, MapPin, Banknote, CreditCard, Bike, XCircle, Printer, ChevronDown, ChevronUp, ArrowRight, Pencil, Check } from 'lucide-react';
import { generateComandaHTML } from '../utils/generateComandaHTML';
import { formatWhatsAppLink } from '../utils/whatsappMessage';
import { updateOrderDeliveryCost } from '@/services/admin.service';

interface ORProps {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, s: string) => void;
  onRefresh?: () => void;
}

const SDOT: Record<string, string> = {
  pending:          'bg-yellow-400',
  'in-preparation': 'bg-blue-400',
  ready:            'bg-green-400', // Sincronizado correctamente a Verde
  delivered:        'bg-emerald-500',
  cancelled:        'bg-red-500',
};

const SNX: Record<string, { l: string; v: string }> = {
  pending:          { l: 'Iniciar proceso', v: 'in-preparation' },
  'in-preparation': { l: 'Marcar listo',     v: 'ready' },
  ready:            { l: 'Entregado',         v: 'delivered' },
};

export function OrderRow({ order, expanded, onToggle, onStatus, onRefresh }: ORProps) {
  const dot = SDOT[order.status] || 'bg-zinc-600';
  const num = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  const isDelivery = order.deliveryType === 'delivery';
  
  const [editingCost, setEditingCost] = useState(false);
  const [costInput, setCostInput]     = useState(String(order.deliveryCost ?? 0));
  const [savingCost, setSavingCost]   = useState(false);

  const handleSaveCost = async () => {
    const val = Number(costInput);
    if (isNaN(val) || val < 0) return;
    setSavingCost(true);
    try {
      await updateOrderDeliveryCost(order._id, val);
      setEditingCost(false);
      onRefresh?.();
    } catch {} finally { setSavingCost(false); }
  };

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
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dot}`} />

        <button className="flex-1 text-left min-w-0" onClick={onToggle}>
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white text-sm font-semibold">{order.customer?.name}</span>
                <span className="text-white/30 text-xs">#{num}</span>
                
                {/* 📞 Botón WhatsApp dinámico (Ubicado idéntico a la foto adjunta) */}
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

      {/* ── Detalle expandido ── */}
      {expanded && (
        <div className="border-t border-[#2A2A2A] px-4 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2">Productos</p>
            <div className="space-y-1">
              {order.items?.map((item: any, i: number) => {
                const totalAddonsQty = item.addons?.reduce((sum: number, a: any) => sum + (a.quantity ?? 0), 0) ?? 0;
                return (
                  <div key={i} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">
                        <span className="text-primary font-bold">{item.quantity}×</span> {item.title}
                        {totalAddonsQty > 0 && <span className="text-xs bg-[#222] border border-white/10 rounded px-1.5 py-0.5 ml-2 text-white/60">Adic: <span className="text-primary font-bold">{totalAddonsQty}</span></span>}
                      </span>
                      <span className="text-white/40 shrink-0 ml-2">${(item.price * item.quantity)?.toLocaleString('es-AR')}</span>
                    </div>
                    {item.addons?.length > 0 && <p className="text-[11px] text-white/30 pl-4 mt-0.5">+ {item.addons.map((a: any) => `${a.quantity}x ${a.title}`).join(', ')}</p>}
                  </div>
                );
              })}
            </div>
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
                  <input type="number" value={costInput} onChange={e => setCostInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveCost(); }} className="w-24 bg-[#0A0A0A] border border-primary/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none text-right" min={0} autoFocus />
                  <button type="button" onClick={handleSaveCost} disabled={savingCost} className="p-1 rounded bg-primary/20 hover:bg-primary/30 text-primary transition-all disabled:opacity-50"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setEditingCost(false); setCostInput(String(order.deliveryCost ?? 0)); }} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/40 transition-all"><XCircle className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <span className="text-white text-xs font-semibold">${(order.deliveryCost ?? 0).toLocaleString('es-AR')}</span>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button onClick={() => setEditingCost(true)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all"><Pencil className="w-3 h-3" /></button>
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
            {order.status !== 'cancelled' && order.status !== 'delivered' && SNX[order.status] && (
              <button onClick={() => onStatus(order._id, SNX[order.status].v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm font-semibold transition-all active:scale-95">
                <ArrowRight className="w-3.5 h-3.5" />
                {SNX[order.status].l}
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button onClick={() => onStatus(order._id, 'cancelled')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold transition-all active:scale-95 ml-auto">
                <XCircle className="w-3.5 h-3.5" />
                Cancelar pedido
              </button>
            )}
            {order.status === 'cancelled' && <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">Pedido Cancelado</span>}
            {order.status === 'delivered' && <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md ml-auto uppercase tracking-wider">Pedido Entregado</span>}
          </div>
        </div>
      )}
    </div>
  );
}