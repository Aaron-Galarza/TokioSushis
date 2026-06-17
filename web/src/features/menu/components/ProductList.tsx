'use client';

import { AlertCircle, RotateCw, SearchX } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import type { Product } from '@/types';

// 👇 1. Agregamos las categorías opcionales a las props
interface ProductListProps {
  products: Product[];
  categories?: { id: string; name: string }[];
  loading: boolean;
  error: string | null;
  isStoreOpen: boolean;
  onRetry?: () => void;
}

// NUESTROS ADICIONALES DE PRUEBA
const dummyAddons = [
  { id: '1', name: 'Extra Cheddar', price: 1000, active: true },
  { id: '2', name: 'Bacon Ahumado', price: 1500, active: true },
  { id: '3', name: 'Huevo Frito', price: 800, active: true }
];

export const ProductList = ({ products, categories = [], loading, error, isStoreOpen, onRetry }: ProductListProps) => {
  if (error) {
    return (
      <div className="flex animate-in flex-col items-center justify-center rounded-3xl border border-white/10 bg-primary/65 p-10 text-center shadow-[0_16px_38px_rgba(0,0,0,0.35)] fade-in">
        <AlertCircle className="mb-3 h-10 w-10 text-secondary" />
        <h3 className="font-heading text-2xl font-bold text-white">No pudimos cargar el menu</h3>
        <p className="mb-5 mt-2 max-w-xl text-sm text-white/65">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-2xl bg-secondary px-5 py-2.5 text-sm font-bold text-primary transition-all duration-300 hover:bg-secondary/90 active:scale-95"
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex animate-in flex-col items-center justify-center rounded-3xl border border-white/10 bg-primary/55 p-12 text-center shadow-[0_16px_38px_rgba(0,0,0,0.35)] fade-in">
        <div className="mb-4 rounded-2xl border border-secondary/30 bg-secondary/15 p-3.5">
          <SearchX className="h-8 w-8 text-secondary/85" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-white">Sin resultados</h3>
        <p className="mt-2 text-sm text-white/65">
          No encontramos productos en esta categoria o con esa busqueda.
        </p>
      </div>
    );
  }

  // 👇 2. SI TENEMOS CATEGORÍAS, AGRUPAMOS CON TÍTULOS
  if (categories.length > 0) {
    return (
      <div className="space-y-12 animate-in fade-in duration-300">
        {categories.map((category) => {
          // Filtramos solo los productos de esta categoría
          const categoryProducts = products.filter((p) => p.category === category.id);
          
          // Si no hay productos (por ejemplo, si usamos el buscador), no mostramos el título
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} className="scroll-mt-32" id={`categoria-${category.id}`}>
              
              {/* TÍTULO DE LA SECCIÓN (Con detalle visual en el borde) */}
              <div className="mb-5 pl-3 border-l-4 border-secondary">
                <h2 className="font-heading text-2xl font-bold text-white tracking-wide uppercase">
                  {category.name}
                </h2>
              </div>
              
              {/* GRILLA DE PRODUCTOS DE ESTA SECCIÓN */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {categoryProducts.map((product, index) => {
                  
                  // Inyectamos los dummy addons SOLO si la categoría es Hamburguesas
                  const isBurger = category.name.toLowerCase() === 'hamburguesas';
                  const productWithAddons = {
                    ...product,
                    addons: product.addons?.length ? product.addons : (isBurger ? dummyAddons : [])
                  };
                  const hasAddons = productWithAddons.addons.length > 0;

                  return (
                    <ProductCard
                      key={productWithAddons.id}
                      product={productWithAddons}
                      isStoreOpen={isStoreOpen}
                      hasAddons={hasAddons}
                      priority={index < 2}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 👇 3. FALLBACK: Si no le pasaron categorías, muestra todo junto como antes
  return (
    <div className="grid animate-in grid-cols-1 gap-5 fade-in duration-300 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => {
        const productWithAddons = { ...product, addons: dummyAddons };
        return (
          <ProductCard
            key={productWithAddons.id}
            product={productWithAddons}
            isStoreOpen={isStoreOpen}
            hasAddons={true}
            priority={index < 2}
          />
        );
      })}
    </div>
  );
};