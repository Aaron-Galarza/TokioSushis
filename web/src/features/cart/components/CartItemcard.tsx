'use client';

import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice } from '@/lib/format';
import { Stepper } from '@/components/ui/Stepper';
import type { CartItem, Addon } from '@/types';

interface CartItemCardProps {
  item: CartItem;
  index: number;
}

export const CartItemCard = ({ item, index }: CartItemCardProps) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemAddon = useCartStore((state) => state.updateItemAddon);
  
  // 1. Extraemos los datos PRIMERO
  const { product, quantity, addons, itemTotal } = item;

  // 2. Estados para la animación y extras
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showAllAddons, setShowAllAddons] = useState(false);

  // 👇 3. EL ANTÍDOTO DEFINITIVO: La Firma de ADN 🧬
  // Creamos un string único con el ID del producto y sus adicionales exactos
  const sortedAddons = [...addons].sort((a, b) => a.addon.id.localeCompare(b.addon.id));
  const dataSignature = `${product.id}-${sortedAddons.map(a => `${a.addon.id}:${a.quantity}`).join('|')}`;
  const [prevSignature, setPrevSignature] = useState(dataSignature);

  // Si el ADN cambia (ej: el producto de abajo subió y ocupó este lugar), le sacamos la invisibilidad al instante
  if (dataSignature !== prevSignature) {
    setPrevSignature(dataSignature);
    setIsRemoving(false);
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
  const imageSrc = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${apiBase}${product.image.startsWith('/') ? '' : '/'}${product.image}`
    : '';

  // Lógica de extras disponibles
  const availableAddons = product.addons || [];
  const visibleAddons = showAllAddons ? availableAddons : availableAddons.slice(0, 3);

  const getAddonQty = (addonId: string) => {
    const found = addons.find(a => a.addon.id === addonId);
    return found ? found.quantity : 0;
  };

  // Lógica de eliminación con animación
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeItem(index);
    }, 300);
  };

  const handleDecrease = () => {
    if (quantity <= 1) {
      handleRemove();
    } else {
      updateQuantity(index, quantity - 1);
    }
  };

  const handleIncrease = () => {
    updateQuantity(index, quantity + 1);
  };

  return (
    <div 
      className={`relative flex flex-col p-3.5 bg-zinc-900/85 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-300 ${
        isRemoving ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'
      }`}
    >
      {/* SECCIÓN SUPERIOR: Info Principal */}
      <div className="flex gap-3">
        {/* Thumbnail del producto */}
        <div className="relative shrink-0 w-16 h-16 bg-zinc-950 rounded-xl overflow-hidden border border-white/10 ring-1 ring-white/5">
          {!imageError && imageSrc ? (
            <img
              src={imageSrc}
              alt={product.title}
              // 👇 ACÁ ESTÁ LA MAGIA: Chau loading="lazy", hola animate-in
              className="h-full w-full object-cover animate-in fade-in duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              Sin img
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[15px] font-bold text-white leading-tight truncate pr-1">
              {product.title}
            </h3>
            <button 
              onClick={handleRemove}
              className="shrink-0 p-1 text-red-300/70 hover:text-red-200 hover:bg-red-500/15 rounded-md transition-colors"
              aria-label={`Eliminar ${product.title} del carrito`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Precio unitario base */}
          <p className="text-xs font-medium text-white/55 mt-0.5">
            {formatPrice(product.price)} c/u
          </p>

          {/* Lista de adicionales seleccionados (Resumen) */}
          {addons.length > 0 && (
            <div className="mt-2 space-y-1 bg-white/5 p-2 rounded-lg border border-white/10">
              {addons.map((a, i) => (
                <div key={i} className="text-xs flex justify-between items-center gap-2 text-white/70">
                  <span className="truncate">
                    <span className="text-primary font-bold">{a.quantity}x</span> {a.addon.name}
                  </span>
                  <span className="shrink-0 font-medium text-white/60">
                    +{formatPrice(a.addon.price * a.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: Stepper y Precio Total */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <Stepper 
          value={quantity} 
          onIncrease={handleIncrease} 
          onDecrease={handleDecrease} 
          minValue={0}
          size="sm"
        />
        <span className="text-xl font-black text-white tracking-tight">
          {formatPrice(itemTotal)}
        </span>
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
        <div className="mt-3 border-t border-white/10 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            {visibleAddons.map((addon: Addon) => (
              <div key={addon.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white/90">{addon.name}</p>
                  <p className="text-xs font-bold text-primary">+{formatPrice(addon.price)}</p>
                </div>
                
                {/* Controles del Adicional Individual */}
                <div className="flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateItemAddon(index, addon, -1);
                    }}
                    className="p-1 text-white/50 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-white">
                    {getAddonQty(addon.id)}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateItemAddon(index, addon, 1);
                    }}
                    className="p-1 text-white/50 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {availableAddons.length > 3 && (
            <button 
              onClick={() => setShowAllAddons(!showAllAddons)}
              className="mt-3 w-full text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {showAllAddons ? 'Ver menos opciones' : `Ver ${availableAddons.length - 3} opciones más`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};