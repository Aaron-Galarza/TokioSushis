'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { deliveryService } from '@/services/delivery.service';

export const useDelivery = () => {
  // [x] Estado: loading: boolean, error: string | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Traemos los datos que necesitamos observar del store
  const deliveryCoordinates = useCartStore((state) => state.deliveryCoordinates);
  const deliveryType = useCartStore((state) => state.deliveryType);
  const setDeliveryCost = useCartStore((state) => state.setDeliveryCost);

  useEffect(() => {
    // [x] No se dispara si deliveryType === 'pickup' o si no hay coordenadas
    if (deliveryType === 'pickup' || !deliveryCoordinates) {
      setError(null);
      return;
    }

    const calculateCost = async () => {
      setLoading(true);
      setError(null);

      // [x] Llama a calculateDeliveryCost(lat, lng)
      const response = await deliveryService.calculateDeliveryCost(
        deliveryCoordinates.lat,
        deliveryCoordinates.lng
      );

      if (response.success && response.data) {
        // [x] Al recibir la respuesta → llama a setDeliveryCost en el store
        setDeliveryCost(response.data.deliveryCost, response.data.distanceKm);
      } else {
        // [x] Si hay error → limpia el costo en el store y expone el error
        setDeliveryCost(0, 0); // Lo limpiamos poniéndolo en 0 para no frenar la app entera, pero evitamos cobrar mal
        setError(response.error || 'No pudimos calcular el costo de envío a esta dirección.');
      }

      setLoading(false);
    };

    calculateCost();
  }, [deliveryCoordinates, deliveryType, setDeliveryCost]);

  return { loading, error };
};