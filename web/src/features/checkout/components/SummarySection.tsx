'use client';

import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { CartItem } from '@/types';

interface Props {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  deliveryType: 'delivery' | 'pickup';
  isDeliveryLoading: boolean;
}

export function SummarySection({ items, subtotal, discount, total, deliveryType, isDeliveryLoading }: Props) {
  const [mounted, setMounted] = useState(false);

  // Asegura que los datos del cliente persistidos coincidan después del primer render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Variables seguras para SSR (Servidor ve 0 y listas vacías, evitamos el Mismatch)
  const safeItems = mounted ? items : [];
  const safeSubtotal = mounted ? subtotal : 0;
  const safeDiscount = mounted ? discount : 0;
  const safeTotal = mounted ? total : 0;
  const safeDeliveryCost = mounted ? Math.max(0, total - subtotal + discount) : 0;

  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
        {safeItems.map((item, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex justify-between items-start text-sm">
              <div className="flex gap-2 text-white/80 pr-4">
                <span className="font-bold text-white/40">{item.quantity}x</span>
                <span className="leading-tight">{item.product.title}</span>
              </div>
              <span className="font-semibold text-primary shrink-0">
                {formatPrice(item.itemTotal)}
              </span>
            </div>
            {item.addons?.length > 0 && (
              <div className="flex flex-col gap-0.5 pl-6">
                {item.addons.map((a, i) => (
                  <div key={i} className="text-xs text-white/50 flex gap-1.5">
                    <span className="text-white/30">↳</span>
                    {a.quantity}x {a.addon.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm text-white/60">
        <span>Subtotal</span>
        <span className="font-medium text-primary/80">{formatPrice(safeSubtotal)}</span>
      </div>

      {safeDiscount > 0 && (
        <div className="flex justify-between text-sm text-primary">
          <span>Descuento</span>
          <span>−{formatPrice(safeDiscount)}</span>
        </div>
      )}

      {deliveryType === 'delivery' && (
        <div className="flex justify-between text-sm text-white/70">
          <span>Envío</span>
          {isDeliveryLoading || !mounted
            ? <span className="text-white/40 animate-pulse">Calculando...</span>
            : <span className="font-medium text-primary">{formatPrice(safeDeliveryCost)}</span>}
        </div>
      )}

      <div className="border-t border-white/10 my-1" />
      <div className="flex justify-between items-center">
        <span className="font-bold text-white">Total a pagar</span>
        <span className="text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(197,168,111,0.25)]">
          {formatPrice(safeTotal)}
        </span>
      </div>
    </div>
  );
}