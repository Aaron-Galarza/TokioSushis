import { z } from 'zod';

// Validador Público (Frontend -> Calcular Envío)
export const calculateDeliverySchema = z.object({
  lat: z.number({ message: 'lat debe ser un numero' }).min(-90).max(90),
  lng: z.number({ message: 'lng debe ser un numero' }).min(-180).max(180),
});

// Validadores Privados (Admin -> Configurar Envío)
const kmRangeBody = z.object({
  maxKm: z.number().positive(),
  price: z.number().min(0),
});

const specialZoneBody = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().positive(),
  price: z.number().min(0),
});

export const updateConfigSchema = z.object({
  kmRanges: z.array(kmRangeBody).optional(),
  specialZones: z.array(specialZoneBody).optional(),
  extraRain: z.number().min(0).optional(),
  isRaining: z.boolean().optional(),
});

export const toggleRainSchema = z.object({
  isRaining: z.boolean(),
  extraRain: z.number().min(0).optional(),
});

export const zoneSchema = specialZoneBody;
export const rangeSchema = kmRangeBody;