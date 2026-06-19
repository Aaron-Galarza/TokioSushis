'use client';

import { useState } from 'react';
import { Plus, PackageX } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  isStoreOpen: boolean;
  priority?: boolean;
}

export const ProductCard = ({ product, isStoreOpen }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = product.controlStock === true && (product.stock ?? 0) <= 0;
  const isButtonDisabled = !isStoreOpen || !product.available || isOutOfStock;

  const isValidImage =
    typeof product.image === 'string' &&
    (product.image.startsWith('http') || product.image.startsWith('/'));

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#141414] px-4 py-3.5 transition-all hover:border-white/15 hover:bg-[#1A1A1A]">

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-sm leading-snug truncate">{product.title}</h3>
        <p className="mt-0.5 text-xs text-white/45 line-clamp-2 leading-relaxed">{product.description}</p>
        <p className="mt-2 font-bold text-primary text-base">{formatPrice(product.price)}</p>
      </div>

      {/* Image + button */}
      <div className="relative shrink-0">
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-zinc-800">
          {!imageError && isValidImage ? (
            <img
              src={product.image}
              alt={product.title}
              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">
              🍣
            </div>
          )}
        </div>

        {/* + button overlaid at bottom-right of image */}
        <button
          onClick={() => !isButtonDisabled && addItem(product, 1, [])}
          disabled={isButtonDisabled}
          className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${
            isButtonDisabled
              ? 'bg-zinc-700 text-white/30 cursor-not-allowed'
              : 'bg-primary text-black hover:bg-primary/90'
          }`}
          aria-label={isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
        >
          {isOutOfStock ? <PackageX className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </article>
  );
};
