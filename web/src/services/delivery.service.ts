const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface DeliveryCostData {
  distanceKm: number;
  pricePerKm: number;
  deliveryCost: number;
}

export interface DeliveryServiceResponse {
  success: boolean;
  data?: DeliveryCostData;
  error?: string;
}

export const deliveryService = {
  calculateDeliveryCost: async (lat: number, lng: number): Promise<DeliveryServiceResponse> => {
    try {
      const response = await fetch(`${API_URL}/delivery/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error del servidor al calcular el envío');
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'No se pudo calcular el costo de envío');
      }

      return {
        success: true,
        data: {
          distanceKm: json.data.distanceKm,
          pricePerKm: json.data.pricePerKm,
          deliveryCost: json.data.deliveryCost,
        },
      };

    } catch (error: any) {
      console.error('[Delivery Service Error]:', error);
      return {
        success: false,
        error: error.message || 'Ocurrió un error inesperado de conexión',
      };
    }
  },
};