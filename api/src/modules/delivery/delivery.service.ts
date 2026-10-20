import { calculateDistanceKm } from '../../utils/distance';
import { DeliveryConfigModel } from './delivery.model';
import { BranchModel } from '../branches/branch.model';
import { AppError } from '../../utils/AppError';

export const calculateDelivery = async (branchId: string, lat: number | string, lng: number | string) => {
  const numLat = Number(lat);
  const numLng = Number(lng);

  const [config, branch] = await Promise.all([
    DeliveryConfigModel.getOrCreateConfig(branchId),
    BranchModel.findById(branchId).select('coordinates').lean(),
  ]);
  if (!branch) throw new AppError(404, 'Sucursal no encontrada');
  const distanceKm = await calculateDistanceKm(numLat, numLng, branch.coordinates.lat, branch.coordinates.lng);

  let baseCost = 0;

  const matched = config.kmRanges.find((r) => distanceKm <= r.maxKm);
  if (!matched) throw new AppError(422, 'La dirección está fuera del rango de envío de esta sucursal');
  baseCost = matched.price;

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
