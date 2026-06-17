'use client';

import { Bike, Store } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

export const DeliveryTypeSelector = () => {
  // Solo traemos el estado y el setter
  const { deliveryType, setDeliveryType } = useCartStore();

  const handleTypeChange = (type: 'pickup' | 'delivery') => {
    setDeliveryType(type);
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Opción: Envío a domicilio */}
      <button
        type="button"
        onClick={() => handleTypeChange('delivery')}
        className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
          deliveryType === 'delivery'
            ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(249,239,188,0.1)]'
            : 'border-white/5 bg-zinc-900/50 hover:border-white/10 hover:bg-zinc-900'
        }`}
      >
        <div className={`p-3 rounded-full ${
          deliveryType === 'delivery' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/40'
        }`}>
          <Bike className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${deliveryType === 'delivery' ? 'text-white' : 'text-white/60'}`}>
            Envío a casa
          </p>
          <p className="text-[10px] uppercase tracking-wider font-medium text-white/40 mt-0.5">
            Delivery
          </p>
        </div>
        {deliveryType === 'delivery' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-4 border-background">
            <div className="w-2 h-2 bg-background rounded-full" />
          </div>
        )}
      </button>

      {/* Opción: Retiro en local */}
      <button
        type="button"
        onClick={() => handleTypeChange('pickup')}
        className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
          deliveryType === 'pickup'
            ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(249,239,188,0.1)]'
            : 'border-white/5 bg-zinc-900/50 hover:border-white/10 hover:bg-zinc-900'
        }`}
      >
        <div className={`p-3 rounded-full ${
          deliveryType === 'pickup' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/40'
        }`}>
          <Store className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${deliveryType === 'pickup' ? 'text-white' : 'text-white/60'}`}>
            Retiro local
          </p>
          <p className="text-[10px] uppercase tracking-wider font-medium text-white/40 mt-0.5">
            Take Away
          </p>
        </div>
        {deliveryType === 'pickup' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-4 border-background">
            <div className="w-2 h-2 bg-background rounded-full" />
          </div>
        )}
      </button>
    </div>
  );
};