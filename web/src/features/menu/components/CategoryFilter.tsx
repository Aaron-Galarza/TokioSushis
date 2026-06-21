'use client';

import { useRef, useState, useEffect } from 'react';
import type { Category } from '@/types';
import { Utensils, Flame, Grid3x3, Droplet, Soup, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('tabla')) return Utensils;
  if (name.includes('wok')) return Flame;
  if (name.includes('salsa') || name.includes('extra')) return Droplet;
  if (name.includes('variado')) return Grid3x3;
  return Soup;
};

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Controla la visibilidad de las flechas según la posición del scroll
  const checkScrollLeft = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      // El -2 es un margen de tolerancia para cálculos en pantallas de alta densidad
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollLeft();
    window.addEventListener('resize', checkScrollLeft);
    return () => window.removeEventListener('resize', checkScrollLeft);
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.6 : clientWidth * 0.6;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (id: string | null) => {
    onSelectCategory(id);
    const productListElement = document.getElementById('product-list-top');
    if (productListElement) {
      const y = productListElement.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-black/95 backdrop-blur-md py-4 border-b border-white/5 relative group">
      
      {/* Flecha Izquierda */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-zinc-900 text-white p-2 rounded-full border border-white/10 shadow-lg transition-all hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Flecha Derecha */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-zinc-900 text-white p-2 rounded-full border border-white/10 shadow-lg transition-all hidden md:flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Contenedor del Scroll con Efecto de Desvanecido Avanzado (Mask Image) */}
      <div 
        ref={scrollRef}
        onScroll={checkScrollLeft}
        className="scrollbar-none flex gap-3 overflow-x-auto px-6 touch-pan-x w-full justify-start md:justify-center"
        style={{
          maskImage: 'linear-gradient(to right, transparent, white 4%, white 96%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, white 4%, white 96%, transparent)'
        }}
      >
        {/* Botón "Todas" */}
        <button
          onClick={() => handleCategoryChange(null)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 shrink-0 ${
            selectedCategory === null
              ? 'bg-primary text-black shadow-[0_4px_12px_rgba(197,168,111,0.3)]'
              : 'bg-[#1A1A1A] text-white hover:bg-zinc-800'
          }`}
        >
          <Grid3x3 className="w-5 h-5" />
          <span>Todas</span>
        </button>

        {/* Categorías Dinámicas */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const Icon = getCategoryIcon(cat.name);
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-primary text-black shadow-[0_4px_12px_rgba(197,168,111,0.3)]'
                  : 'bg-[#1A1A1A] text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};