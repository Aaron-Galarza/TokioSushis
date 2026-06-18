import { calculateDelivery as calculateTariff } from '../deliveryTariffs/deliveryTariff.service';

// Delega al tarifario dinámico (zonas especiales + rangos km + plus lluvia).
// Mantiene la misma firma de retorno que usaban orders.service y el controller.
export const calculateDelivery = async (lat: number, lng: number) => {
  const result = await calculateTariff(lat, lng);
  return {
    distanceKm:   result.distanceKm,
    deliveryCost: result.total,
    breakdown: {
      baseCost:      result.baseCost,
      rainSurcharge: result.rainSurcharge,
      appliedZone:   result.appliedZone,
    },
  };
};
