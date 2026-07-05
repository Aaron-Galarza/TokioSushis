'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeroProps {
  banner: string;
  isOpen: boolean;
  loading: boolean;
  searchQuery: string;
  onSearch: (q: string) => void;
}

export const FeaturedBanner = ({
  banner,
  isOpen,
  loading,
  searchQuery,
  onSearch,
}: HeroProps) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => { setLocalSearch(searchQuery); }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== searchQuery) onSearch(localSearch);
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, onSearch, searchQuery]);

  return (
    <section className="relative w-full min-h-[440px] flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      {banner ? (
        <img src={banner} alt="Tokyo Sushis" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-10 pb-4 w-full max-w-xl">
        {/* Logo circle */}
        <div className="w-24 h-24 rounded-full border-2 border-primary/40 bg-black/60 flex items-center justify-center mb-5 shadow-[0_0_32px_rgba(197,168,111,0.2)] overflow-hidden">
          <img
            src="/tokyoSushis.webp"
            alt="Tokyo Sushis"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand */}
        <h1 className="font-heading italic text-3xl sm:text-4xl font-semibold tracking-[0.18em] text-primary mb-1">
          TOKYO SUSHIS
        </h1>
        <p className="font-heading italic text-white/70 text-base mb-5">
          Auténtica cocina japonesa
        </p>

        {/* Status badge */}
        {!loading && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-6 ${
            isOpen ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            {isOpen ? 'ABIERTO AHORA' : 'CERRADO'}
          </div>
        )}

        {/* Search */}
        <div className="relative w-full mb-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar tablas, rolls, woks..."
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-primary/50 backdrop-blur-sm"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(''); onSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};