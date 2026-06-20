'use client';

import { AlertCircle, RotateCw, SearchX } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

interface ProductListProps {
  products: Product[];
  categories?: { id: string; name: string }[];
  loading: boolean;
  error: string | null;
  isStoreOpen: boolean;
  selectedCategory?: string | null;
  onRetry?: () => void;
}

const Skeleton = () => (
  <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#141414] px-4 py-3.5 animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-white/10 rounded w-2/3" />
      <div className="h-3 bg-white/5 rounded w-full" />
      <div className="h-5 bg-primary/20 rounded w-1/4 mt-2" />
    </div>
    <div className="w-[72px] h-[72px] rounded-xl bg-white/5 shrink-0" />
  </div>
);

export const ProductList = ({
  products,
  categories = [],
  loading,
  error,
  isStoreOpen,
  selectedCategory,
  onRetry,
}: ProductListProps) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70 p-10 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-primary" />
        <h3 className="font-heading text-2xl font-semibold text-white">No pudimos cargar el menú</h3>
        <p className="mb-5 mt-2 max-w-xl text-sm text-white/50">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-black hover:bg-primary/90 active:scale-95 transition-all"
          >
            <RotateCw className="h-4 w-4" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/60 p-12 text-center">
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3.5">
          <SearchX className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-heading text-2xl font-semibold text-white">Sin resultados</h3>
        <p className="mt-2 text-sm text-white/50">
          No encontramos productos en esta categoría o con esa búsqueda.
        </p>
      </div>
    );
  }

  // When a specific category is selected, show its products in a flat list
  if (selectedCategory && categories.length > 0) {
    const cat = categories.find((c) => c.id === selectedCategory);
    return (
      <div className="space-y-3">
        {cat && (
          <div className="mb-4">
            <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-2">
              {cat.name}
            </h2>
            <div className="h-[2px] w-16 bg-primary rounded-full" />
          </div>
        )}
        {products.map((p) => (
          <ProductCard key={p.id} product={p} isStoreOpen={isStoreOpen} />
        ))}
      </div>
    );
  }

  // Show all categories (selectedCategory === null)
  if (categories.length > 0) {
    return (
      <div className="space-y-10">
        {categories.map((category) => {
          const catProducts = products.filter((p) => p.category === category.id);
          if (catProducts.length === 0) return null;
          return (
            <div key={category.id}>
              <div className="mb-4">
                <h2 className="font-heading text-xl font-semibold text-white uppercase tracking-wide mb-2">
                  {category.name}
                </h2>
                <div className="h-[2px] w-16 bg-primary rounded-full" />
              </div>
              <div className="space-y-3">
                {catProducts.map((p) => (
                  <ProductCard key={p.id} product={p} isStoreOpen={isStoreOpen} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isStoreOpen={isStoreOpen} />
      ))}
    </div>
  );
};
