'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice } from '@/lib/format';
import { Stepper } from '@/components/ui/Stepper';
import { CartItemHeader } from './CartItemHeader';
import { CartItemExtrasPanel } from './CartItemExtrasPanel';
import type { CartItem, Addon } from '@/types';

interface CartItemCardProps {
  item: CartItem;
  index: number;
}

export const CartItemCard = ({ item, index }: CartItemCardProps) => {
  const updateQuantity  = useCartStore(s => s.updateQuantity);
  const removeItem      = useCartStore(s => s.removeItem);
  const updateItemAddon = useCartStore(s => s.updateItemAddon);

  const { product, quantity, addons, itemTotal } = item;

  const [isRemoving, setIsRemoving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  // DNA signature: evita estado stale cuando los items se reordenan tras un split/merge
  const sortedAddons   = [...addons].sort((a, b) => a.addon.id.localeCompare(b.addon.id));
  const dataSignature  = `${product.id}-${sortedAddons.map(a => `${a.addon.id}:${a.quantity}`).join('|')}`;
  const [prevSignature, setPrevSignature] = useState(dataSignature);
  if (dataSignature !== prevSignature) {
    setPrevSignature(dataSignature);
    setIsRemoving(false);
  }

  const apiBase   = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
  const imageSrc  = product.image
    ? product.image.startsWith('http') ? product.image : `${apiBase}${product.image.startsWith('/') ? '' : '/'}${product.image}`
    : '';

  const availableAddons = product.addons ?? [];
  const getAddonQty     = (id: string) => addons.find(a => a.addon.id === id)?.quantity ?? 0;

  const handleRemove   = () => { setIsRemoving(true); setTimeout(() => removeItem(index), 300); };
  const handleDecrease = () => quantity <= 1 ? handleRemove() : updateQuantity(index, quantity - 1);
  const handleIncrease = () => updateQuantity(index, quantity + 1);

  return (
    <div className={`relative flex flex-col p-3.5 bg-zinc-900/85 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-300
      ${isRemoving ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}`}
    >
      <CartItemHeader
        title={product.title}
        price={product.price}
        imageSrc={imageSrc}
        imageError={imageError}
        onImageError={() => setImageError(true)}
        addons={addons}
        onRemove={handleRemove}
      />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <Stepper value={quantity} onIncrease={handleIncrease} onDecrease={handleDecrease} minValue={0} size="sm" />
        <span className="text-xl font-black text-white tracking-tight">{formatPrice(itemTotal)}</span>
      </div>

      {availableAddons.length > 0 && (
        <button
          onClick={() => setShowExtras(!showExtras)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/5 py-2 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white/90 transition-all"
        >
          {showExtras ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showExtras ? 'Cerrar opciones' : 'Agregar más extras'}
        </button>
      )}

      {showExtras && (
        <CartItemExtrasPanel
          availableAddons={availableAddons}
          getAddonQty={getAddonQty}
          onAddonChange={(addon: Addon, delta: number) => updateItemAddon(index, addon, delta)}
        />
      )}
    </div>
  );
};