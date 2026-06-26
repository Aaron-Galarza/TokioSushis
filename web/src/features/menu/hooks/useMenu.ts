'use client';

// NOTA: Este archivo reemplaza el useMenu.ts existente.
// Agrega la carga de adicionales y los inyecta en cada producto según su categoría.
// La firma del hook no cambia — los componentes que lo consumen no se tocan.

import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';
import type { Product, Category, Addon } from '@/types';

export function useMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);

        // Traemos todo en paralelo: productos, categorías y TODOS los adicionales activos
        const [prods, cats, allAddons] = await Promise.all([
          menuService.getProducts(),
          menuService.getCategories(),
          menuService.getAddons(), // sin filtro → trae todos los activos
        ]);

        // Inyectamos en cada producto los adicionales que le corresponden.
        // Un adicional corresponde a un producto si:
        //   a) su array categories incluye la categoría del producto, O
        //   b) su array categories está vacío (aplica a todos)
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
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return { products, categories, isLoading, error };
}