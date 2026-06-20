import type { Product, Category, Addon } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

export const menuService = {
  
 // 1. OBTENER PRODUCTOS
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error('Error al obtener productos');
      
      const json = await response.json();
      
      if (!json.success) throw new Error(json.error || 'Error en la API');

      // 👇 ACÁ ESTÁ LA CLAVE: agregamos ", index: number" al lado de item
      return json.data.map((item: any, index: number) => ({
        ...item,
        id: item._id, 
        available: item.available ?? true,
        featured: item.featured ?? (index === 0), // Ahora sí reconoce el index
        category: typeof item.category === 'object' ? item.category._id : item.category
      }));

    } catch (error) {
      console.error('Error fetching products:', error);
      return []; 
    }
  },

  // 2. OBTENER CATEGORÍAS
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error('Error al obtener categorías');
      
      const json = await response.json();
      
      if (!json.success) throw new Error(json.error || 'Error en la API');

      // Mapeamos _id a id
      return json.data.map((item: any) => ({
        ...item,
        id: item._id
      }));

    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // 3. OBTENER ESTADO DEL LOCAL (Abierto/Cerrado y Banner)
  getStoreStatus: async (): Promise<{ isOpen: boolean; message: string; banner?: string }> => {
    try {
      const response = await fetch(`${API_URL}/config/status`);

      if (!response.ok) {
        console.warn('⚠️ Ruta /api/config/status falló. Usando estado abierto por defecto.');
        return { isOpen: true, message: '', banner: '' };
      }

      const json = await response.json();

      if (json.success && json.data) {
        return {
          isOpen: json.data.isOpen ?? true,
          message: json.data.message ?? '',
          banner: json.data.banner ?? '',
        };
      }

      return { isOpen: true, message: '', banner: '' };

    } catch (error) {
      console.warn('⚠️ No se pudo conectar al backend de configuración. Local abierto por defecto.');
      return { isOpen: true, message: '', banner: '' };
    }
  }
};