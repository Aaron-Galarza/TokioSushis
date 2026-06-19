'use client';

import { useMenu } from '@/features/menu/hooks/useMenu';
import { useStoreStatus } from '@/features/menu/hooks/useStoreStatus';
import { FeaturedBanner } from '@/features/menu/components/FeaturedBanner';
import { ProductList } from '@/features/menu/components/ProductList';

export default function HomePage() {
  const { isOpen, loading: statusLoading, banner } = useStoreStatus();
  const {
    categories,
    loading: menuLoading,
    error: menuError,
    selectedCategory,
    filteredProducts,
    selectCategory,
    setSearch,
    searchQuery,
  } = useMenu();

  return (
    <main className="flex min-h-screen flex-col">
      <FeaturedBanner
        banner={banner}
        isOpen={isOpen}
        loading={statusLoading}
        searchQuery={searchQuery}
        onSearch={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={selectCategory}
      />

      <section id="product-list-top" className="mx-auto w-full max-w-2xl px-4 pb-14 pt-8">
        <ProductList
          products={filteredProducts}
          loading={menuLoading}
          error={menuError}
          isStoreOpen={isOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          onRetry={() => window.location.reload()}
        />
      </section>
    </main>
  );
}
