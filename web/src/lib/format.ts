
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