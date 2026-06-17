'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Search, X } from 'lucide-react';
import { useAddressSearch } from '@/features/checkout/hooks/useAddressSearch';
import { useCartStore } from '@/stores/cart.store';

export const AddressAutocomplete = () => {
  // 1. PRIMERO leemos el store para saber si ya había una dirección guardada
  const deliveryAddress = useCartStore((state) => state.deliveryAddress);
  const setDeliveryAddress = useCartStore((state) => state.setDeliveryAddress);
  const clearDelivery = useCartStore((state) => state.clearDelivery);

  // 2. INICIALIZAMOS los estados con la memoria del store (Hidratación directa)
  const [inputValue, setInputValue] = useState(deliveryAddress || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(!!deliveryAddress);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // EL CANDADO ANTI-PETICIONES: Sigue intacto
  const { results, loading } = useAddressSearch(isSelected ? '' : inputValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);

    if (isSelected) {
      setIsSelected(false);
      clearDelivery();
    }
  };

  const handleSelect = (result: { placeName: string; lat: number; lng: number }) => {
    setInputValue(result.placeName);
    setIsSelected(true);
    setIsOpen(false);
    setDeliveryAddress(result.placeName, { lat: result.lat, lng: result.lng });
  };

  const handleClear = () => {
    setInputValue('');
    setIsSelected(false);
    clearDelivery();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Contenedor del Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/50">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Ingresá tu dirección (ej: San Martín 1500)"
          className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/90 transition-colors"
            aria-label="Limpiar dirección"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de Sugerencias */}
      {isOpen && inputValue.length >= 4 && !isSelected && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="p-4 text-center text-xs text-white/50 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando direcciones...
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto custom-scrollbar">
              {results.map((result, idx) => {
                const parts = result.placeName.split(',');
                const mainText = parts[0];
                const secondaryText = parts.slice(1).join(',').trim();

                return (
                  <li key={`${result.lat}-${result.lng}-${idx}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      className="w-full text-left px-4 py-3 min-h-[48px] hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group"
                    >
                      <MapPin className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white/90 truncate">
                          {mainText}
                        </span>
                        {secondaryText && (
                          <span className="text-xs text-white/50 truncate">
                            {secondaryText}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-white/60 bg-zinc-900/50">
              No encontramos esa dirección, intentá con más detalle
            </div>
          )}
        </div>
      )}
    </div>
  );
};