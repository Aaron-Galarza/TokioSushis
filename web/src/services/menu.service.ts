import type { Product, Category, Addon } from '@/types';
import api from './api';

export const menuService = {

  // 1. OBTENER PRODUCTOS
  getProducts: async (): Promise<Product[]> => {
    try {
      const { data: json } = await api.get('/products');
      if (!json.success) throw new Error(json.error || 'Error en la API');

      return json.data.map((item: any, index: number) => ({
        ...item,
        id: item._id,
        available: item.available ?? true,
        featured: item.featured ?? (index === 0),
        category: typeof item.category === 'object' ? item.category._id : item.category,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // 2. OBTENER CATEGORÍAS
  getCategories: async (): Promise<Category[]> => {
    try {
      const { data: json } = await api.get('/categories');
      if (!json.success) throw new Error(json.error || 'Error en la API');

      return json.data.map((item: any) => ({
        ...item,
        id: item._id,
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // 3. OBTENER ADICIONALES — opcionalmente filtrados por categoryId
  // El backend ya soporta GET /addons?category=<id>
  // Si categories está vacío en el adicional, el backend lo devuelve igual (aplica a todos)
  getAddons: async (categoryId?: string): Promise<Addon[]> => {
    try {
      const { data: json } = await api.get('/addons', { params: categoryId ? { category: categoryId } : undefined });
      if (!json.success) throw new Error(json.error || 'Error en la API');

      return json.data.map((item: any) => ({
        id: item._id,
        name: item.title,             // el backend guarda "title", el front usa "name"
        price: item.price,
        active: item.active,
        categories: item.categories ?? [], // array populado: [{ _id, name, active }]
      }));
    } catch (error) {
      console.error('Error fetching addons:', error);
      throw error;
    }
  },

  // 4. OBTENER ESTADO DEL LOCAL
  getStoreStatus: async (): Promise<{ isOpen: boolean; message: string; banner?: string }> => {
    try {
      const { data: json } = await api.get('/config/status');

      if (json.success && json.data) {
        return {
          isOpen: json.data.isOpen === true,
          message: json.data.message ?? '',
          banner: json.data.banner ?? '',
        };
      }

      return { isOpen: false, message: 'No se pudo confirmar el horario de la sucursal.', banner: '' };
    } catch (error) {
      console.warn('No se pudo consultar el estado de la sucursal.', error);
      return { isOpen: false, message: 'No se pudo confirmar el horario de la sucursal.', banner: '' };
    }
  },
};
