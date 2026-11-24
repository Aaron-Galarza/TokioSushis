import api from './admin-api';
export type AdminRange = 'hoy' | 'ayer' | 'semana' | 'mes';

// ── Orders ──────────────────────────────────────────────────────────────────
export const fetchAdminOrders = (range: AdminRange = 'hoy') =>
  api.get(`/orders/admin/range?range=${range}`).then(r => r.data.data ?? []);
export const updateOrderStatus = (id: string, status: string, deliveryCost?: number) =>
  api.put(`/orders/admin/${id}`, { status, ...(deliveryCost !== undefined ? { deliveryCost } : {}) });
export const updateOrderDeliveryCost = (id: string, deliveryCost: number) =>
  api.put(`/orders/admin/${id}`, { deliveryCost });
export const deleteOrder = (id: string) => api.delete(`/orders/admin/${id}`);
export const createAdminOrder = (payload: Record<string, unknown>) =>
  api.post('/orders', payload).then(r => r.data);

// ── Analytics ───────────────────────────────────────────────────────────────
export const fetchAnalytics = (range: AdminRange) =>
  api.get(`/analytics?range=${range}`).then(r => r.data.data);

// ── Menu ────────────────────────────────────────────────────────────────────
export const fetchAdminProducts = () => api.get('/products/admin').then(r => r.data.data);
export const createProduct = (payload: Record<string, unknown>) => api.post('/products/admin', payload);
export const updateProduct = (id: string, payload: Record<string, unknown>) => api.put(`/products/admin/${id}`, payload);
export const toggleProductActive = (id: string) => api.put(`/products/admin/toggleActive/${id}`);
export const deleteProduct = (id: string) => api.delete(`/products/admin/${id}`);

export const fetchAdminCategories = () => api.get('/categories/admin').then(r => r.data.data);
export const createCategory = (payload: Record<string, unknown>) => api.post('/categories/admin', payload);
export const updateCategory = (id: string, payload: Record<string, unknown>) => api.put(`/categories/admin/${id}`, payload);
export const toggleCategoryActive = (id: string) => api.put(`/categories/admin/toggleActive/${id}`);
export const deleteCategory = (id: string) => api.delete(`/categories/admin/${id}`);

export const fetchAdminAddons = () => api.get('/addons/admin').then(r => r.data.data);
export const createAddon = (payload: Record<string, unknown>) => api.post('/addons/admin', payload);
export const updateAddon = (id: string, payload: Record<string, unknown>) => api.put(`/addons/admin/${id}`, payload);
export const toggleAddonActive = (id: string) => api.put(`/addons/admin/toggleActive/${id}`);
export const deleteAddon = (id: string) => api.delete(`/addons/admin/${id}`);

// ── Ingredientes y pasos de productos configurables ────────────────────────
export const fetchAdminOptions = () => api.get('/options/admin').then(r => r.data.data);
export const createOption = (payload: Record<string, unknown>) => api.post('/options/admin', payload);
export const updateOption = (id: string, payload: Record<string, unknown>) => api.put(`/options/admin/${id}`, payload);
export const toggleOption = (id: string) => api.put(`/options/admin/toggleActive/${id}`);
export const deleteOption = (id: string) => api.delete(`/options/admin/${id}`);
export const fetchAdminOptionGroups = () => api.get('/option-groups/admin').then(r => r.data.data);
export const createOptionGroup = (payload: Record<string, unknown>) => api.post('/option-groups/admin', payload);
export const updateOptionGroup = (id: string, payload: Record<string, unknown>) => api.put(`/option-groups/admin/${id}`, payload);
export const toggleOptionGroup = (id: string) => api.put(`/option-groups/admin/toggleActive/${id}`);
export const deleteOptionGroup = (id: string) => api.delete(`/option-groups/admin/${id}`);

// ── Coupons ─────────────────────────────────────────────────────────────────
export const fetchAdminCoupons = () => api.get('/coupons/admin').then(r => r.data.data);
export const createCoupon = (payload: Record<string, unknown>) => api.post('/coupons/admin', payload);
export const updateCoupon = (id: string, payload: Record<string, unknown>) => api.put(`/coupons/admin/${id}`, payload);
export const deleteCoupon = (id: string) => api.delete(`/coupons/admin/${id}`);

// ── Gallery ─────────────────────────────────────────────────────────────────
export const fetchGallery = () => api.get('/gallery').then(r => r.data.data ?? []);
export const uploadImage = (formData: FormData) =>
  api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteGalleryImage = (id: string) => api.delete(`/gallery/${id}`);

// ── Config ──────────────────────────────────────────────────────────────────
export const fetchConfigStatus  = () => api.get('/config/admin-config').then(r => r.data.data);
export const fetchDeliveryConfig = () => api.get('/delivery/config').then(r => r.data.data);
export const toggleEmergency    = () => api.put('/config/status').then(r => r.data.data.isEmergencyClosed as boolean);
export const saveSchedule       = (payload: unknown[]) => api.put('/config/schedule', payload);
export const saveBanner         = (banner: string) => api.put('/config/banner', { banner });
export const patchRain          = (isRaining: boolean, extraRain: number) =>
  api.patch('/delivery/config/rain', { isRaining, extraRain });
export const addKmRange = (maxKm: number, price: number) =>
  api.post('/delivery/config/ranges', { maxKm, price }).then(r => r.data.data?.data ?? []);
export const deleteKmRange = (id: string) =>
  api.delete(`/delivery/config/ranges/${id}`).then(r => r.data.data?.data ?? []);
