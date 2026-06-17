'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

export const SearchBar = ({ searchQuery, onSearch }: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(searchQuery);

  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== searchQuery) {
        onSearch(localValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onSearch, searchQuery]);

  const handleClear = () => {
    setLocalValue('');
    onSearch('');
  };

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
        <Search className="h-4 w-4" />
      </div>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Buscar hamburguesas, papas, bebidas..."
        className="block h-12 w-full rounded-2xl border border-white/10 bg-black/25 py-3 pl-11 pr-11 text-sm font-medium text-white placeholder:text-white/40 transition-all duration-300 focus:border-secondary/55 focus:outline-none focus:ring-2 focus:ring-secondary/25"
      />

      {localValue && (
        <button
          onClick={handleClear}
          type="button"
          className="absolute inset-y-0 right-3 flex items-center text-white/45 transition-all duration-200 hover:text-white/80 active:scale-95"
          aria-label="Limpiar busqueda"
        >
          <span className="rounded-full border border-white/10 bg-white/5 p-1">
            <X className="h-3.5 w-3.5" />
          </span>
        </button>
      )}
    </div>
  );
};
