'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { GenericConfigurator, type GenericConfigResult } from './GenericConfigurator';
import type { Product } from '@/types';

interface ProductConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  isStoreOpen: boolean;
  /** Si se pasa, reemplaza el comportamiento por defecto (agregar al carrito). */
  onConfigure?: (result: GenericConfigResult) => void;
}

export const ProductConfiguratorModal = ({
  isOpen,
  onClose,
  product,
  isStoreOpen,
  onConfigure,
}: ProductConfiguratorModalProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleAddToCart = (result: GenericConfigResult) => {
    if (onConfigure) {
      onConfigure(result);
      onClose();
      return;
    }
    const configuredProduct: Product = { ...product, price: result.price };
    addItem(configuredProduct, 1, [], result.selections, result.summary);
    onClose();
  };

  const configurator = product.configurator;

  if (!isOpen || !configurator?.enabled || !isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-[#0D0D0D] border border-white/10 rounded-3xl overflow-hidden flex flex-col animate-slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0D0D0D]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">{product.title}</h2>
              <p className="text-xs text-white/50">Precio base: ${product.price.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <GenericConfigurator
            configurator={configurator}
            basePrice={product.price}
            isStoreOpen={isStoreOpen}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>
    </div>
  );
};
