import { z } from 'zod';

export const calculateDeliverySchema = z.object({
  lat: z.number({ message: 'lat debe ser un numero' }).min(-90).max(90),
  lng: z.number({ message: 'lng debe ser un numero' }).min(-180).max(180),
});

const kmRangeBody = z.object({
  maxKm: z.number().positive(),
  price: z.number().min(0),
});

export const updateConfigSchema = z.object({
  kmRanges:  z.array(kmRangeBody).optional(),
  extraRain: z.number().min(0).optional(),
  isRaining: z.boolean().optional(),
});

export const toggleRainSchema = z.object({
  isRaining: z.boolean(),
  extraRain: z.number().min(0).optional(),
});

export const rangeSchema = kmRangeBody;