'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, MapPin, Wallet, Bike, ShoppingBag, ArrowLeft, UtensilsCrossed, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface OrderSnapshot {
  orderNumber?: number;
  customerName: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress: string | null;
  paymentMethod: string;
  notes: string; // Recibido desde el sessionStorage
  items: {
    title: string;
    quantity: number;
    price: number;
    addons: { name: string; quantity: number; price: number }[];
    itemTotal: number;
  }[];
  subtotal: number;
  discount: number;
  surcharge: number; // Sincronizado
  total: number;
  couponCode: string | null;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('order_confirmation');
    if (!raw) {
      setOrder(prev => {
        if (!prev) setNotFound(true);
        return prev;
      });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setOrder(parsed);
      sessionStorage.removeItem('order_confirmation');
    } catch {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
        <p className="text-white/40 text-sm mb-4">No encontramos información de tu pedido.</p>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al menú
        </button>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const num = order.orderNumber ? `#${String(order.orderNumber).padStart(4, '0')}` : null;
  
  // Cálculo exacto del envío para el desglose final
  const orderDeliveryCost = Math.max(0, order.total - order.subtotal + order.discount - order.surcharge);

  // Verificación de método de pago con tarjeta (débito o crédito)
  const normalizedPayment = order.paymentMethod.toLowerCase();
  const isCardPayment = 
    normalizedPayment.includes('debito') || 
    normalizedPayment.includes('débito') || 
    normalizedPayment.includes('credito') || 
    normalizedPayment.includes('crédito');

  // Construcción dinámica del mensaje final según logística y pago
  const isDelivery = order.deliveryType === 'delivery';
  let infoMessage = isDelivery
    ? 'Estamos preparando tu pedido. En breve saldrá hacia tu domicilio.'
    : 'Tu pedido estará listo para retirar por el local en unos minutos.';

  if (isCardPayment) {
    infoMessage += isDelivery
      ? ' Te estaremos enviando el link de pago para proceder con el abono de forma segura.'
      : ' Recordá que podrás abonar con posnet al momento de realizar el retiro en el local.';
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-start px-4 py-12">
      <div className="w-full max-w-lg flex flex-col gap-5">

        {/* Encabezado Éxito */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">¡Tu pedido está confirmado!</h1>
            <p className="text-white/50 text-sm mt-1">
              Gracias, <span className="text-white font-semibold">{order.customerName}</span>. Ya estamos preparando todo para vos
            </p>
            {num && (
              <p className="mt-2 text-xs text-white/30 font-mono">
                Pedido <span className="text-primary font-bold">{num}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bloque Logística de Entrega y Pago */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {isDelivery ? (
              <Bike className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <ShoppingBag className="w-4 h-4 text-green-400 shrink-0" />
            )}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Entrega</p>
              <p className="text-sm text-white font-semibold">
                {isDelivery ? 'Delivery a domicilio' : 'Retiro en local'}
              </p>
            </div>
          </div>
          
          {order.deliveryAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Dirección</p>
                <p className="text-sm text-white">{order.deliveryAddress}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4 text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Método de Pago</p>
              <p className="text-sm text-white font-semibold">{order.paymentMethod}</p>
            </div>
          </div>

          {order.notes && (
            <div className="flex items-start gap-3 border-t border-white/5 pt-2 mt-1">
              <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Aclaraciones del pedido</p>
                <p className="text-sm text-white/80 italic">"{order.notes}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Desglose de Productos */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <p className="text-xs text-white/40 uppercase tracking-wider">Tu pedido</p>
          </div>
          
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="text-primary font-bold">{item.quantity}×</span> {item.title}
                  </p>
                  {item.addons.length > 0 && (
                    <p className="text-[11px] text-white/35 mt-0.5 pl-4">
                      + {item.addons.map(a => `${a.quantity}x ${a.name}`).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-sm text-white/60 shrink-0 ml-3">{formatPrice(item.itemTotal)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-xs text-white/40">
              <span>Subtotal productos</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-green-400">
                <span>Descuento {order.couponCode && `(${order.couponCode})`}</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            )}

            {isDelivery && (
              <div className="flex justify-between text-xs text-white/40">
                <span>Costo de envío</span>
                <span>{formatPrice(orderDeliveryCost)}</span>
              </div>
            )}

            {order.surcharge > 0 && (
              <div className="flex justify-between text-xs text-orange-400">
                <span>Recargo Crédito (15%)</span>
                <span>+{formatPrice(order.surcharge)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-white mt-1 border-t border-white/5 pt-2">
              <span>Total abonado</span>
              <span className="text-primary text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Cartel Informativo Final */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-center">
          <p className="text-sm text-white/70 leading-relaxed">
            {infoMessage}
          </p>
          {normalizedPayment.includes('credito') || normalizedPayment.includes('crédito') ? (
            <p className="text-[11px] text-white/40 mt-2">
              El recargo del 15% por pago con tarjeta ya se encuentra incluido en el total.
            </p>
          ) : null}
        </div>

        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm font-semibold transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al menú
        </button>

      </div>
    </main>
  );
}