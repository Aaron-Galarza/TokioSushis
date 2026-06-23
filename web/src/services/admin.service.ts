import api from './api';

export type AdminRange = 'hoy' | 'ayer' | 'semana' | 'mes';

// ── Orders ──────────────────────────────────────────────────────────────────
export const fetchAdminOrders = () =>
  api.get('/orders/admin/range?range=hoy').then(r => r.data.data ?? []);

export const updateOrderStatus = (id: string, status: string) =>
  api.put(`/orders/admin/${id}`, { status });

// ── Analytics ───────────────────────────────────────────────────────────────
export const fetchAnalytics = (range: AdminRange) =>
  api.get(`/analytics?range=${range}`).then(r => r.data.data);

// ── Menu ────────────────────────────────────────────────────────────────────
export const fetchAdminProducts = () =>
  api.get('/products/admin').then(r => r.data.data);

export const createProduct = (payload: Record<string, any>) =>
  api.post('/products/admin', payload);

export const updateProduct = (id: string, payload: Record<string, any>) =>
  api.put(`/products/admin/${id}`, payload);

export const toggleProductActive = (id: string) =>
  api.put(`/products/admin/toggleActive/${id}`);

export const deleteProduct = (id: string) =>
  api.delete(`/products/admin/${id}`);

export const fetchAdminCategories = () =>
  api.get('/categories/admin').then(r => r.data.data);

export const createCategory = (payload: Record<string, any>) =>
  api.post('/categories/admin', payload);

export const updateCategory = (id: string, payload: Record<string, any>) =>
  api.put(`/categories/admin/${id}`, payload);

export const toggleCategoryActive = (id: string) =>
  api.put(`/categories/admin/toggleActive/${id}`);

export const deleteCategory = (id: string) =>
  api.delete(`/categories/admin/${id}`);

export const fetchAdminAddons = () =>
  api.get('/addons/admin').then(r => r.data.data);

export const createAddon = (payload: Record<string, any>) =>
  api.post('/addons/admin', payload);

export const updateAddon = (id: string, payload: Record<string, any>) =>
  api.put(`/addons/admin/${id}`, payload);

export const toggleAddonActive = (id: string) =>
  api.put(`/addons/admin/toggleActive/${id}`);

export const deleteAddon = (id: string) =>
  api.delete(`/addons/admin/${id}`);

// ── Coupons ─────────────────────────────────────────────────────────────────
export const fetchAdminCoupons = () =>
  api.get('/coupons/admin').then(r => r.data.data);

export const createCoupon = (payload: Record<string, any>) =>
  api.post('/coupons/admin', payload);

export const updateCoupon = (id: string, payload: Record<string, any>) =>
  api.put(`/coupons/admin/${id}`, payload);

export const deleteCoupon = (id: string) =>
  api.delete(`/coupons/admin/${id}`);

// ── Gallery ─────────────────────────────────────────────────────────────────
export const fetchGallery = () =>
  api.get('/gallery').then(r => r.data.data ?? []);

export const uploadImage = (formData: FormData) =>
  api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteGalleryImage = (id: string) =>
  api.delete(`/gallery/${id}`);

// ── Config ──────────────────────────────────────────────────────────────────
export const fetchConfigStatus = () =>
  api.get('/config/admin-config').then(r => r.data.data);

export const fetchDeliveryConfig = () =>
  api.get('/delivery/config').then(r => r.data.data);

export const toggleEmergency = () =>
  api.put('/config/status').then(r => r.data.data.isEmergencyClosed as boolean);

export const saveSchedule = (payload: any[]) =>
  api.put('/config/schedule', payload);

export const saveBanner = (banner: string) =>
  api.put('/config/banner', { banner });

export const patchRain = (isRaining: boolean, extraRain: number) =>
  api.patch('/delivery/config/rain', { isRaining, extraRain });

export const addKmRange = (maxKm: number, price: number) =>
  api.post('/delivery/config/ranges', { maxKm, price }).then(r => r.data.data ?? []);

export const deleteKmRange = (id: string) =>
  api.delete(`/delivery/config/ranges/${id}`).then(r => r.data.data ?? []);

export const addSpecialZone = (payload: Record<string, any>) =>
  api.post('/delivery/config/zones', payload).then(r => r.data.data ?? []);

export const deleteSpecialZone = (id: string) =>
  api.delete(`/delivery/config/zones/${id}`).then(r => r.data.data ?? []);
