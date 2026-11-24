'use client';

import { useState } from 'react';
import { ChevronDown, Plus, PackageX } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice } from '@/lib/format';
import { cloudinaryImage } from '@/lib/image';
import type { Product } from '@/types';
import styles from './ProductCard.module.css';
import { ProductConfigurator } from './ProductConfigurator';

interface ProductCardProps {
  product: Product;
  isStoreOpen: boolean;
}

export const ProductCard = ({ product, isStoreOpen }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [configuring, setConfiguring] = useState(false);

  const isOutOfStock = product.controlStock === true && (product.stock ?? 0) <= 0;
  const isButtonDisabled = !isStoreOpen || !product.available || isOutOfStock;
  const isValidImage =
    typeof product.image === 'string' &&
    (product.image.startsWith('http') || product.image.startsWith('/'));

  return (
    <article data-expanded={expanded} className={`${styles.card} relative rounded-2xl border border-white/8 bg-[#141414] px-4 py-3.5 transition-colors hover:border-white/15 hover:bg-[#1A1A1A]`}>
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Cerrar' : 'Ver'} detalles de ${product.title}`}
      />

      <h3 className={`${styles.title} flex min-w-0 items-start gap-2 text-sm font-semibold leading-snug text-white`}>
        <span className={`${styles.titleText} min-w-0 flex-1`}>{product.title}</span>
        <ChevronDown aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform duration-200 motion-reduce:transition-none md:hidden ${expanded ? 'rotate-180' : ''}`} />
      </h3>

      <p className={`${styles.description} min-w-0 text-xs leading-relaxed text-white/45`}>
        {product.description}
      </p>
      <p className={`${styles.price} min-w-0 text-base font-bold text-primary`}>{formatPrice(product.price)}</p>

      <div className={`${styles.media} relative shrink-0`}>
        <div className="h-full w-full overflow-hidden rounded-xl bg-zinc-800">
          {!imageError && isValidImage ? (
            <img
              src={cloudinaryImage(product.image, 400)}
              alt={product.title}
              className={`h-full w-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-white/20">🍣</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => { if (!isButtonDisabled) { if (product.tipoProducto === 'configurable') setConfiguring(true); else addItem(product, 1, []); } }}
          disabled={isButtonDisabled}
          className={`absolute -bottom-2 -right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 ${
            isButtonDisabled
              ? 'cursor-not-allowed bg-zinc-700 text-white/30'
              : 'bg-white text-primary hover:scale-110'
          }`}
          aria-label={isOutOfStock ? 'Sin stock' : `Agregar ${product.title} al carrito`}
        >
          {isOutOfStock ? <PackageX className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      {configuring && <ProductConfigurator product={product} onClose={() => setConfiguring(false)} onConfirm={(ingredients, detail) => { addItem({ ...detail, addons: product.addons }, 1, [], ingredients); setConfiguring(false); }} />}
    </article>
  );
};
