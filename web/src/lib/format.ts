
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0, // No queremos mostrar los centavos para la comida
  }).format(price);
};

/**
 * Formatea la distancia en kilómetros (ej: 4.5 km)
 */
export const formatDistance = (km: number): string => {
  // Redondea a 1 decimal. Si es 4.0, le saca el ".0" para que quede "4 km"
  return `${km.toFixed(1).replace('.0', '')} km`;
};

/**
 * Número de pedido de 4 dígitos, con fallback a los últimos 4 caracteres del _id.
 */
export const formatOrderNumber = (order: { orderNumber?: number; _id?: string }): string =>
  String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');