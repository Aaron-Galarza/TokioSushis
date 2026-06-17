import { calculateDistanceKm } from '../../utils/distance';
import { ConfigModel } from '../Schedules/Schedule.module';

export const calculateDelivery = async (lat: number, lng: number) => {
  const config = await ConfigModel.getOrCreateConfig();
  const pricePerKm = config.pricePerKm ?? 0;
  const distanceKm = await calculateDistanceKm(lat, lng);
  const deliveryCost = Math.ceil(distanceKm * pricePerKm);

  return {
    distanceKm,
    pricePerKm,
    deliveryCost,
  };
};
