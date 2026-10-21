import api from '@/services/api';

export interface DeliveryCostData {
  distanceKm: number;
  deliveryCost: number;
}

export interface DeliveryServiceResponse {
  success: boolean;
  data?: DeliveryCostData;
  error?: string;
}

// Dedup de requests en vuelo: useDelivery se instancia en dos componentes
// (useCheckout y DeliveryCostPreview) y ambos disparan el cálculo con las
// mismas coordenadas. Con esto sale una sola llamada HTTP al backend.
const inFlight = new Map<string, Promise<DeliveryServiceResponse>>();

const doCalculate = async (branchSlug: string, lat: number, lng: number): Promise<DeliveryServiceResponse> => {
  try {
    const response = await api.post('/delivery/calculate', { lat, lng }, {
      headers: { 'X-Branch-Slug': branchSlug },
    });
    const json = response.data;

    if (!json.success) {
      throw new Error(json.error || 'No se pudo calcular el costo de envío');
    }

    return {
      success: true,
      data: {
        distanceKm: json.data.distanceKm,
        deliveryCost: json.data.deliveryCost,
      },
    };

  } catch (error: unknown) {
    const apiError = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return {
      success: false,
      error: apiError.response?.data?.error || apiError.response?.data?.message ||
        apiError.message || 'Ocurrió un error inesperado de conexión',
    };
  }
};

export const deliveryService = {
  calculateDeliveryCost: async (branchSlug: string, lat: number, lng: number): Promise<DeliveryServiceResponse> => {
    if (!branchSlug) return { success: false, error: 'Falta seleccionar una sucursal' };
    const k = `${branchSlug}:${lat},${lng}`;
    const existing = inFlight.get(k);
    if (existing) return existing;

    const promise = doCalculate(branchSlug, lat, lng);
    inFlight.set(k, promise);
    try {
      return await promise;
    } finally {
      inFlight.delete(k);
    }
  },
};
