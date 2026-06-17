'use client';

import { useMemo, useState } from 'react';
import {
  Flame,
  MessageCircle,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import type { Product } from '@/types';
import { FeaturedBannerVisual } from './FeaturedBannerVisual';

interface FeaturedBannerProps {
  products: Product[];
  isStoreOpen: boolean;
}

export const FeaturedBanner = ({ products, isStoreOpen }: FeaturedBannerProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured && product.available),
    [products]
  );

  if (featuredProducts.length === 0) return null;

  const safeIndex = currentIndex % featuredProducts.length;
  const currentProduct = featuredProducts[safeIndex];
  const hasImageError = brokenImages[currentProduct.id];
  const canNavigate = featuredProducts.length > 1;
  const isButtonDisabled = !isStoreOpen || !currentProduct.available;
  const hasAddons = currentProduct.category === 'hamburguesas';

  const handleImageError = (productId: string) => {
    setBrokenImages((prev) => ({ ...prev, [productId]: true }));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const handleAddClick = () => {
    if (hasAddons) {
      alert('Aqui se abrira el AddonsModal para personalizar tu: ' + currentProduct.title);
      return;
    }
    addItem(currentProduct, 1, []);
  };

  const scrollToMenu = () => {
    const target = document.getElementById('product-list-top');
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <section className="mb-7 animate-in rounded-3xl border border-white/10 bg-primary/70 p-5 shadow-[0_24px_52px_rgba(0,0,0,0.42)] fade-in duration-500 sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[1.08fr_1fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/35 bg-secondary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            <Flame className="h-3.5 w-3.5" />
            Hot & Fast Delivery
          </span>

          <h2 className="max-w-[14ch] font-heading text-4xl font-bold leading-[1.03] text-white sm:text-5xl">
            Autenticas Artesanales directo a tu puerta.
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-white/70">
            {currentProduct.description}. Preparado al momento, con ingredientes frescos y despacho
            rapido para que llegue en su punto.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleAddClick}
              disabled={isButtonDisabled}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 active:scale-95 ${
                isButtonDisabled
                  ? 'cursor-not-allowed border border-white/15 bg-white/10 text-white/50'
                  : 'bg-secondary text-primary shadow-[0_6px_16px_rgba(249,239,188,0.18)] hover:bg-secondary/90'
              }`}
            >
              <Plus className="h-4 w-4" />
              Pedir Destacada
            </button>

            <button
              onClick={scrollToMenu}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-black/25 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-black/35 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              Ver Menu
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 text-sm text-white/60">
            <span>35-50 min</span>
            <span>Efectivo / MPago</span>
            <span>Delivery & Take Away</span>
            <a
              href="https://www.instagram.com/americanway"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/65 transition-all hover:border-secondary/35 hover:text-secondary active:scale-95"
              aria-label="Instagram American Way"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
                <circle cx="12" cy="12" r="4.1" />
                <circle cx="17.25" cy="6.75" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://wa.me/5491123456789"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/65 transition-all hover:border-secondary/35 hover:text-secondary active:scale-95"
              aria-label="WhatsApp American Way"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FeaturedBannerVisual
          currentProduct={currentProduct}
          hasImageError={hasImageError}
          onImageError={handleImageError}
          canNavigate={canNavigate}
          onPrev={handlePrev}
          onNext={handleNext}
          featuredProducts={featuredProducts}
          safeIndex={safeIndex}
          onSelect={setCurrentIndex}
        />
      </div>
    </section>
  );
};
