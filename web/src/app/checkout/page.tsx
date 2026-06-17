'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Receipt } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useDelivery } from '@/features/checkout/hooks/useDelivery';
import { formatPrice } from '@/lib/format';

import { DeliveryTypeSelector } from '@/features/checkout/components/DeliveryTypeSelector';
import { AddressAutocomplete } from '@/features/checkout/components/AddressAutocomplete';
import { DeliveryCostPreview } from '@/features/checkout/components/DeliveryCostPreview';
import { AddressMap } from '@/features/checkout/components/AddressMap';

export default function CheckoutPage() {
  const router = useRouter();
  
  const { items, deliveryType, deliveryCoordinates, getTotals } = useCartStore();
  const { loading: isDeliveryLoading } = useDelivery();
  const { subtotal, discount, total } = getTotals();

  const isConfirmDisabled = 
    items.length === 0 || 
    (deliveryType === 'delivery' && !deliveryCoordinates) || 
    (deliveryType === 'delivery' && isDeliveryLoading); 

  const handleConfirmOrder = () => {
    if (isConfirmDisabled) return;
    console.log("¡Listo para pagar!");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-white/50 mb-4">Tu pedido está vacío</p>
        <button onClick={() => router.push('/cart')} className="text-primary font-bold">
          Volver al carrito
        </button>
      </div>
    );
  }

  // 👇 Le sacamos el pb-24 al contenedor principal
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/cart" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/90">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-xl tracking-wide text-white mt-1">FINALIZAR PEDIDO</h1>
        </div>
      </header>

      {/* 👇 Le agregamos pb-12 al main para que tenga aire al final del scroll */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">
            Método de entrega
          </h2>
          <DeliveryTypeSelector />
        </section>

        {deliveryType === 'delivery' && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">
              ¿A dónde lo enviamos?
            </h2>
            <div className="flex flex-col gap-2">
              <AddressAutocomplete />
              <DeliveryCostPreview />
              <AddressMap />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Resumen de pago
          </h2>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            
            <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex justify-between items-start text-sm">
                    <div className="flex gap-2 text-white/80 pr-4">
                      <span className="font-bold text-white/40">{item.quantity}x</span>
                      <span className="leading-tight">{item.product.title}</span>
                    </div>
                    <span className="font-semibold text-red-400 shrink-0">
                      {formatPrice(item.itemTotal)}
                    </span>
                  </div>
                  
                  {item.addons && item.addons.length > 0 && (
                    <div className="flex flex-col gap-0.5 pl-6">
                      {item.addons.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs text-white/50">
                          <span className="truncate flex gap-1.5">
                            <span className="text-white/30">↳</span> {a.quantity}x {a.addon.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span className="font-medium text-red-400/80">{formatPrice(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Descuento aplicado</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-sm text-white/70">
                <span>Envío</span>
                {isDeliveryLoading ? (
                  <span className="text-white/40 animate-pulse">Calculando...</span>
                ) : (
                  <span className="font-medium text-red-400">
                    {getTotals().total - subtotal + discount > 0 
                      ? formatPrice(getTotals().total - subtotal + discount) 
                      : formatPrice(0)}
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-white/10 my-1"></div>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Total a pagar</span>
              <span className="text-2xl font-black text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </section>

        {/* 👇 SECCIÓN 4: Botón de Confirmación (Ahora fluye con el contenido) */}
        <section className="mt-2">
          <button
            onClick={handleConfirmOrder}
            disabled={isConfirmDisabled}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              isConfirmDisabled
                ? 'bg-zinc-800 text-white/30 cursor-not-allowed'
                : 'bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(249,239,188,0.2)]'
            }`}
          >
            {isDeliveryLoading ? 'Calculando envío...' : 'Confirmar Pedido'}
            {!isConfirmDisabled && <CheckCircle2 className="w-5 h-5" />}
          </button>
        </section>

      </main>
    </div>
  );
}