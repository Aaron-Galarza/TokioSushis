'use client';
import { useRef, useState, useEffect } from 'react';
import type { Category } from '@/types';
import { Grid3x3, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollLeft = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
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
      scrollRef.current.scrollBy({ left: direction === 'left' ? -clientWidth * 0.6 : clientWidth * 0.6, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (id: string | null) => {
    onSelectCategory(id);
    const el = document.getElementById('product-list-top');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
  };

  return (
    /* 📱 SE FIJA ACÁ: 'max-md:sticky max-md:top-0 max-md:z-50' hace que en mobile quede pegado arriba al scrollear */
    <div className="w-full bg-black/95 backdrop-blur-md py-4 border-b border-white/5 max-md:sticky max-md:top-0 max-md:z-50">
      <div className="relative mx-auto w-full max-w-6xl group">
        {showLeftArrow && (
          <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-zinc-900 text-white p-2 rounded-full border border-white/10 shadow-lg transition-all hidden md:flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
        )}
        {showRightArrow && (
          <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-zinc-900 text-white p-2 rounded-full border border-white/10 shadow-lg transition-all hidden md:flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScrollLeft}
          className="scrollbar-none flex gap-3 overflow-x-auto px-6 touch-pan-x w-full justify-start"
          style={{
            maskImage: 'linear-gradient(to right, transparent, white 4%, white 96%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, white 4%, white 96%, transparent)',
          }}
        >
          <button
            onClick={() => handleCategoryChange(null)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 active:scale-95 shrink-0 ${
              selectedCategory === null
                ? 'bg-primary text-black shadow-[0_4px_12px_rgba(197,168,111,0.3)]'
                : 'bg-[#1A1A1A] text-white hover:bg-zinc-800'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
            <span>Todas</span>
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const Icon = getCategoryIcon(cat.name, cat.icon);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 active:scale-95 shrink-0 ${
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
    </div>
  );
};