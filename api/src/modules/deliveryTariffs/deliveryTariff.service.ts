import { calculateDistanceKm } from '../../utils/distance';
import { DeliveryTariffModel } from './deliveryTariff.model';

const haversineMetres = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export interface DeliveryCalculation {
  distanceKm: number;
  baseCost: number;
  rainSurcharge: number;
  appliedZone: string | null;
  total: number;
}

export const calculateDelivery = async (
  lat: number | string,
  lng: number | string
): Promise<DeliveryCalculation> => {
  const numLat = Number(lat);
  const numLng = Number(lng);

  const [tariff, distanceKm] = await Promise.all([
    DeliveryTariffModel.getOrCreateTariff(),
    calculateDistanceKm(numLat, numLng),
  ]);

  let baseCost = 0;
  let appliedZone: string | null = null;

  // Prioridad 1: zona especial (geocerca circular con haversine)
  for (const zone of tariff.specialZones) {
    if (haversineMetres(numLat, numLng, zone.lat, zone.lng) <= zone.radiusMeters) {
      baseCost = zone.price;
      appliedZone = zone.name;
      break;
    }
  }

  // Prioridad 2: rangos por km (ya ordenados asc por el pre-save hook del modelo)
  if (!appliedZone) {
    const matched = tariff.kmRanges.find((r) => distanceKm <= r.maxKm);
    if (matched) {
      baseCost = matched.price;
    } else if (tariff.kmRanges.length > 0) {
      // Distancia supera todos los rangos: se cobra el último (más caro)
      baseCost = tariff.kmRanges[tariff.kmRanges.length - 1].price;
    }
  }

  const rainSurcharge = tariff.isRaining ? tariff.extraRain : 0;

  return {
    distanceKm,
    baseCost,
    rainSurcharge,
    appliedZone,
    total: baseCost + rainSurcharge,
  };
};
