'use client';

import type { Category } from '@/types';

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
  const handleCategoryChange = (id: string | null) => {
    onSelectCategory(id);
    const productListElement = document.getElementById('product-list-top');
    if (productListElement) {
      const y = productListElement.getBoundingClientRect().top + window.scrollY - 250;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      <div className="scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 pr-1 touch-pan-x">
        

        {categories.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`shrink-0 snap-start rounded-2xl border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.13em] transition-all duration-300 active:scale-95 ${
                isActive
                  ? 'border-secondary/60 bg-secondary text-primary shadow-[0_4px_12px_rgba(249,239,188,0.16)]'
                  : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:bg-black/30 hover:text-white'
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
