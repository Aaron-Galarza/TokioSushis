'use client';

import { useState, useEffect, useMemo } from 'react';
import { menuService } from '@/services/menu.service';
import type { Product, Category, Addon } from '@/types';

export function useMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [prods, cats, allAddons] = await Promise.all([
          menuService.getProducts(),
          menuService.getCategories(),
          menuService.getAddons(),
        ]);

        // Inyectar en cada producto los adicionales que le corresponden:
        // a) el array categories del addon incluye la categoría del producto, O
        // b) el array categories está vacío (aplica a todos)
        const prodsWithAddons: Product[] = prods.map((product) => {
          const applicable = allAddons.filter((addon: Addon) =>
            addon.categories.length === 0 ||
            addon.categories.some((c) => c._id === product.category)
          );
          return { ...product, addons: applicable };
        });

        setProducts(prodsWithAddons);
        setCategories(cats);
      } catch (err) {
        setError('Error al cargar el menú');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const selectCategory = (id: string | null) => setSelectedCategory(id);
  const setSearch = (q: string) => setSearchQuery(q);

  return {
    products,
    categories,
    loading,
    error,
    selectedCategory,
    filteredProducts,
    selectCategory,
    setSearch,
    searchQuery,
  };
}