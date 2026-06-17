'use client';

import { useMenu } from '@/features/menu/hooks/useMenu';
import { useStoreStatus } from '@/features/menu/hooks/useStoreStatus';
import { StoreClosed } from '@/features/menu/components/StoreClosed';
import { FeaturedBanner } from '@/features/menu/components/FeaturedBanner';
import { SearchBar } from '@/features/menu/components/SearchBar';
import { CategoryFilter } from '@/features/menu/components/CategoryFilter';
import { ProductList } from '@/features/menu/components/ProductList';

export default function HomePage() {
  const { isOpen, message, loading: statusLoading } = useStoreStatus();
  const {
    products,
    categories,
    loading: menuLoading,
    error: menuError,
    selectedCategory,
    searchQuery,
    filteredProducts,
    selectCategory,
    setSearch,
  } = useMenu();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8">
      {!statusLoading && !isOpen && <StoreClosed message={message} />}

      {!menuLoading && !menuError && <FeaturedBanner products={products} isStoreOpen={isOpen} />}

      <div className="sticky top-16 z-30 mt-4 space-y-2.5 rounded-3xl border border-white/10 bg-background/90 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:p-4">
        <SearchBar searchQuery={searchQuery} onSearch={setSearch} />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={selectCategory}
        />
      </div>

      <section id="product-list-top" className="mt-6 sm:mt-7">
        <ProductList
          products={filteredProducts}
          loading={menuLoading}
          error={menuError}
          isStoreOpen={isOpen}
          categories={categories}
          onRetry={() => window.location.reload()}
        />
      </section>
    </main>
  );
}
