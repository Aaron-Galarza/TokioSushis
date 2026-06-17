'use client';

import { Receipt } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice } from '@/lib/format';

export const CartSummary = () => {
  // Suscribirse a los estados reactivos del store
  const deliveryType = useCartStore((state) => state.deliveryType);
  const deliveryCost = useCartStore((state) => state.deliveryCost);
  const getTotals = useCartStore((state) => state.getTotals);
  const coupon = useCartStore((state) => state.coupon);

  // Zustand extrae los totales calculados en tiempo real
  const { subtotal, discount, total } = getTotals();

  // Si el carrito está vacío, no tiene sentido mostrar el resumen
  if (subtotal === 0) return null;

  return (
    <article className="rounded-2xl border border-white/10 bg-background/50 p-4 shadow-lg backdrop-blur-sm sm:rounded-3xl sm:p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3 sm:mb-6 sm:pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary sm:h-10 sm:w-10">
          <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <h3 className="font-heading text-lg font-bold text-white sm:text-xl">Resumen del pedido</h3>
      </div>

      <div className="space-y-3 text-sm text-white/70 sm:space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span>Subtotal de productos</span>
          <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
        </div>

        {/* Descuento (Condicional) */}
        {coupon && discount > 0 && (
          <div className="flex items-center justify-between text-emerald-400">
            <span>Descuento ({coupon.code})</span>
            <span className="font-bold">-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Costo de Envío */}
        <div className="flex items-center justify-between">
          <span>
            {deliveryType === 'pickup' ? 'Retiro por el local' : 'Costo de envío'}
          </span>
          <span className="font-semibold text-white">
            {deliveryType === 'pickup' || deliveryCost === 0
              ? 'Sin costo'
              : formatPrice(deliveryCost)}
          </span>
        </div>
      </div>

      {/* Separador */}
      <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent sm:my-5" />

      {/* Total Final */}
      <div className="flex items-end justify-between">
        <span className="text-base font-bold text-white/90">Total a pagar</span>
        <span className="font-heading text-2xl font-black text-secondary drop-shadow-md sm:text-3xl">
          {formatPrice(total)}
        </span>
      </div>
    </article>
  );
};
