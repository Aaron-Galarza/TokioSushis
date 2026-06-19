import { calculateDistanceKm } from '../../utils/distance'; // <- Asegurate de que esta ruta a tu Mapbox sea correcta
import { DeliveryConfigModel } from './delivery.model';

const haversineMetres = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calculateDelivery = async (lat: number | string, lng: number | string) => {
  const numLat = Number(lat);
  const numLng = Number(lng);

  // Ejecutamos Mapbox y buscamos la configuración en paralelo
  const [config, distanceKm] = await Promise.all([
    DeliveryConfigModel.getOrCreateConfig(),
    calculateDistanceKm(numLat, numLng),
  ]);

  let baseCost = 0;
  let appliedZone: string | null = null;

  // 1. Zonas especiales (Shopping, Rivera, etc.)
  for (const zone of config.specialZones) {
    if (haversineMetres(numLat, numLng, zone.lat, zone.lng) <= zone.radiusMeters) {
      baseCost = zone.price;
      appliedZone = zone.name;
      break;
    }
  }

  // 2. Rangos por km
  if (!appliedZone) {
    const matched = config.kmRanges.find((r) => distanceKm <= r.maxKm);
    if (matched) {
      baseCost = matched.price;
    } else if (config.kmRanges.length > 0) {
      // Si vive súper lejos, le cobra el último rango configurado
      baseCost = config.kmRanges[config.kmRanges.length - 1].price;
    }
  }

  const rainSurcharge = config.isRaining ? config.extraRain : 0;
  const finalCost = baseCost + rainSurcharge;

  // ESTA ESTRUCTURA ES LA QUE ESPERA EL FRONTEND Y LAS ÓRDENES
  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    deliveryCost: finalCost, // <- OBLIGATORIO LLAMARLO ASÍ
    details: {
      baseCost,
      rainSurcharge,
      appliedZone,
      isRaining: config.isRaining
    }
  };
};