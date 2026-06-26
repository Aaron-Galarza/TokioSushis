'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { menuService } from '@/services/menu.service';
import type { Product, Category, Addon } from '@/types';

const CACHE_KEY = 'tokio_menu_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

type CachePayload = { products: Product[]; categories: Category[] };

function readCache(): CachePayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null; // vencido → miss
    return data;
  } catch {
    return null;
  }
}

function writeCache(products: Product[], categories: Category[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: { products, categories }, ts: Date.now() }));
  } catch {}
}

export function useMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (showLoader: boolean) => {
    if (showLoader) setLoading(true);
    try {
      const [prods, cats, allAddons] = await Promise.all([
        menuService.getProducts(),
        menuService.getCategories(),
        menuService.getAddons(),
      ]);
      const prodsWithAddons: Product[] = prods.map((product) => {
        const applicable = allAddons.filter((addon: Addon) =>
          addon.categories.length === 0 ||
          addon.categories.some((c) => c._id === product.category)
        );
        return { ...product, addons: applicable };
      });
      writeCache(prodsWithAddons, cats);
      setProducts(prodsWithAddons);
      setCategories(cats);
      setError(null);
    } catch (err) {
      console.error(err);
      // Solo mostramos error en la carga visible. Un refetch en segundo plano
      // que falla NO debe reemplazar el menú ya visible por una pantalla de error.
      if (showLoader) setError('Error al cargar el menú');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setProducts(cached.products);
      setCategories(cached.categories);
      setLoading(false);
      load(false); // refresco silencioso
    } else {
      load(true);
    }

    // Al volver a la pestaña, solo refetcheamos si el cache venció.
    // Evita llamadas innecesarias por cada alt-tab de un segundo.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !readCache()) load(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  return {
    products, categories, loading, error, selectedCategory,
    filteredProducts,
    selectCategory: (id: string | null) => setSelectedCategory(id),
    setSearch: (q: string) => setSearchQuery(q),
    searchQuery,
  };
}