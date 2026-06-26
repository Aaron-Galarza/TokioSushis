'use client';
import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Search, X } from 'lucide-react';
import { useAddressSearch, AddressResult } from '@/features/checkout/hooks/useAddressSearch';

interface Props {
  value: string;
  onChange: (result: AddressResult) => void;
  onClear: () => void;
  placeholder?: string;
}

// Componente controlado: no toca el cartStore directamente.
// Puede usarse desde checkout (pasándole el store) o desde el admin (pasándole estado local).
export const AddressAutocomplete = ({
  value,
  onChange,
  onClear,
  placeholder = "Ingresá tu calle y altura (ej: Av. Sarmiento 2500)",
}: Props) => {
  const [inputValue, setInputValue]   = useState(value || '');
  const [isOpen, setIsOpen]           = useState(false);
  const [isSelected, setIsSelected]   = useState(!!value);
  const dropdownRef                   = useRef<HTMLDivElement>(null);

  const { results, loading } = useAddressSearch(isSelected ? '' : inputValue);

  // Sincronizar si el padre limpia el valor
  useEffect(() => {
    if (!value) { setInputValue(''); setIsSelected(false); }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    if (isSelected) { setIsSelected(false); onClear(); }
  };

  const handleSelect = (result: AddressResult) => {
    setInputValue(result.placeName);
    setIsSelected(true);
    setIsOpen(false);
    onChange(result);
  };

  const handleClear = () => {
    setInputValue('');
    setIsSelected(false);
    onClear();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/50">
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
            : <Search className="w-5 h-5" />}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && inputValue.length >= 4 && !isSelected && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="p-4 text-center text-xs text-white/50 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando direcciones...
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {results.map((result, index) => {
                const parts       = result.placeName.split(',');
                const mainText    = parts[0];
                const secondaryText = parts.slice(1).join(',').trim();
                return (
                  <li key={`${result.lat}-${result.lng}-${index}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      className="w-full text-left px-4 py-3 min-h-[48px] hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group"
                    >
                      <MapPin className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white/90 truncate">{mainText}</span>
                        {secondaryText && (
                          <span className="text-xs text-white/50 truncate">{secondaryText}</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-white/60">
              No encontramos esa dirección, intentá con más detalle
            </div>
          )}
        </div>
      )}
    </div>
  );
};