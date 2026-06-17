'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Star } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';

interface FeaturedBannerVisualProps {
  currentProduct: Product;
  hasImageError: boolean;
  onImageError: (productId: string) => void;
  canNavigate: boolean;
  onPrev: () => void;
  onNext: () => void;
  featuredProducts: Product[];
  safeIndex: number;
  onSelect: (index: number) => void;
}

export const FeaturedBannerVisual = ({
  currentProduct,
  hasImageError,
  onImageError,
  canNavigate,
  onPrev,
  onNext,
  featuredProducts,
  safeIndex,
  onSelect,
}: FeaturedBannerVisualProps) => {
  return (
    <div className="relative">
      <article className="relative h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-background sm:h-[360px]">
        {!hasImageError && currentProduct.image ? (
          <>
            <Image
              src={currentProduct.image}
              alt={currentProduct.title}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
              onError={() => onImageError(currentProduct.id)}
              priority // <--- ¡Acá está la solución para el LCP!
            />
            <div className="absolute inset-0 bg-black/35" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white/35">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}

        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-secondary/55 bg-secondary/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
          <Star className="h-3.5 w-3.5 fill-current" />
          La mas nueva
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
          <div>
            <h3 className="font-heading text-2xl font-bold text-white drop-shadow-sm">
              {currentProduct.title}
            </h3>
            <p className="text-lg font-black text-secondary">{formatPrice(currentProduct.price)}</p>
          </div>
        </div>
      </article>

      {canNavigate && (
        <>
          <button
            onClick={onPrev}
            className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background/90 text-white/80 transition-all duration-300 hover:border-white/40 hover:text-white active:scale-95"
            aria-label="Producto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background/90 text-white/80 transition-all duration-300 hover:border-white/40 hover:text-white active:scale-95"
            aria-label="Producto siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {canNavigate && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {featuredProducts.map((product, index) => (
            <button
              key={product.id}
              onClick={() => onSelect(index)}
              aria-label={`Ir al destacado ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === safeIndex ? 'w-8 bg-secondary' : 'w-2.5 bg-white/30 hover:bg-white/55'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};