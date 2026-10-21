'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { menuService } from '@/services/menu.service';
import type { Product, Category, Addon } from '@/types';

const cacheKey = (slug: string) => `tokio_menu_cache_v2:${slug}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

type CachePayload = { products: Product[]; categories: Category[] };

function readCache(slug: string): CachePayload | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null; // vencido → miss
    return data;
  } catch {
    return null;
  }
}

function writeCache(slug: string, products: Product[], categories: Category[]) {
  try {
    sessionStorage.setItem(cacheKey(slug), JSON.stringify({ data: { products, categories }, ts: Date.now() }));
  } catch {}
}

export function useMenu() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const activeSlug = useRef(slug);
  activeSlug.current = slug;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadedSlug, setLoadedSlug] = useState('');
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
        ).map((addon: Addon) => ({ ...addon, categories: addon.categories.map((category) => {
          const known = cats.find((candidate) => candidate.id === category._id);
          return known ? { _id: known.id, name: known.name, active: known.active } : category;
        }) }));
        return { ...product, addons: applicable };
      });
      if (activeSlug.current !== slug) return;
      writeCache(slug, prodsWithAddons, cats);
      setProducts(prodsWithAddons);
      setCategories(cats);
      setLoadedSlug(slug);
      setError(null);
    } catch (err) {
      console.error(err);
      // Solo mostramos error en la carga visible. Un refetch en segundo plano
      // que falla NO debe reemplazar el menú ya visible por una pantalla de error.
      if (showLoader && activeSlug.current === slug) {
        setLoadedSlug(slug);
        setError('Error al cargar el menú');
      }
    } finally {
      if (showLoader && activeSlug.current === slug) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setSelectedCategory(null);
    setSearchQuery('');
    const cached = readCache(slug);
    if (cached) {
      setProducts(cached.products);
      setCategories(cached.categories);
      setLoadedSlug(slug);
      setLoading(false);
      load(false); // refresco silencioso
    } else {
      load(true);
    }

    // Al volver a la pestaña, solo refetcheamos si el cache venció.
    // Evita llamadas innecesarias por cada alt-tab de un segundo.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !readCache(slug)) load(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load, slug]);

  const filteredProducts = useMemo(() => {
    if (loadedSlug !== slug) return [];
    let result = products;
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, searchQuery, loadedSlug, slug]);

  return {
    products: loadedSlug === slug ? products : [],
    categories: loadedSlug === slug ? categories : [],
    loading: loadedSlug === slug ? loading : true,
    error: loadedSlug === slug ? error : null,
    selectedCategory,
    filteredProducts,
    selectCategory: (id: string | null) => setSelectedCategory(id),
    setSearch: (q: string) => setSearchQuery(q),
    searchQuery,
  };
}
