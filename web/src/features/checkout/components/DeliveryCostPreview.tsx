'use client';

import { Store, Loader2, MapPin, AlertCircle, Bike } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useDelivery } from '@/features/checkout/hooks/useDelivery';
import { formatPrice } from '@/lib/format';

export const DeliveryCostPreview = () => {
  // 1. Nos traemos la data del store
  const { deliveryType, deliveryAddress, distanceKm, deliveryCost } = useCartStore();

  // 2. Nos conectamos al hook que orquesta todo por detrás
  const { loading, error } = useDelivery();

  // [x] Si es pickup: "Retiro en el local — sin costo de envío"
  if (deliveryType === 'pickup') {
    return (
      <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary mt-4 animate-in fade-in zoom-in-95 duration-300">
        <Store className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">Retiro en el local — sin costo de envío</span>
      </div>
    );
  }

  // [x] Si no hay dirección seleccionada todavía: un placeholder suave
  if (!deliveryAddress && !loading) {
    return (
      <div className="p-4 mt-4 border border-white/5 border-dashed rounded-xl flex items-center justify-center text-white/30 text-sm animate-in fade-in duration-300">
        Ingresá tu dirección para calcular el envío
      </div>
    );
  }

  // [x] Estado de error
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span className="text-sm font-medium">
          No pudimos calcular el envío. Verificá que la dirección sea correcta.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-zinc-900/80 border border-white/10 rounded-xl mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* [x] Estado calculando: spinner + texto */}
      {loading ? (
        <div className="flex items-center gap-3 text-white/60 py-1">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Calculando costo de envío...</span>
        </div>
      ) : (
        /* [x] Estado con resultado: Distancia y Costo */
        <>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4" />
              <span>Distancia:</span>
            </div>
            {/* .toFixed(1) para que muestre "4.5 km" en vez de "4.5321 km" */}
            <span className="font-bold text-white">{distanceKm.toFixed(1)} km</span>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-white/70">
              <Bike className="w-4 h-4" />
              <span>Costo de envío:</span>
            </div>
            <span className="font-black text-primary text-base">
              {formatPrice(deliveryCost)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};