import { calculateDistanceKm } from '../../utils/distance';
import { DeliveryConfigModel } from './delivery.model';

export const calculateDelivery = async (lat: number | string, lng: number | string) => {
  const numLat = Number(lat);
  const numLng = Number(lng);

  const [config, distanceKm] = await Promise.all([
    DeliveryConfigModel.getOrCreateConfig(),
    calculateDistanceKm(numLat, numLng),
  ]);

  let baseCost = 0;

  const matched = config.kmRanges.find((r) => distanceKm <= r.maxKm);
  if (matched) {
    baseCost = matched.price;
  } else if (config.kmRanges.length > 0) {
    baseCost = config.kmRanges[config.kmRanges.length - 1].price;
  }

  const rainSurcharge = config.isRaining ? config.extraRain : 0;
  const finalCost = baseCost + rainSurcharge;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    deliveryCost: finalCost,
    details: {
      baseCost,
      rainSurcharge,
      isRaining: config.isRaining,
    },
  };
};