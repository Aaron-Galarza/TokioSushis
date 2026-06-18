import { z } from 'zod';

const kmRangeBody = z.object({
  maxKm: z.number({ message: 'maxKm debe ser un número' }).positive({ message: 'maxKm debe ser positivo' }),
  price: z.number({ message: 'price debe ser un número' }).min(0, { message: 'El precio no puede ser negativo' }),
});

const specialZoneBody = z.object({
  name:         z.string({ message: 'El nombre de la zona es obligatorio' }).min(1),
  lat:          z.number().min(-90).max(90),
  lng:          z.number().min(-180).max(180),
  radiusMeters: z.number().positive({ message: 'El radio debe ser positivo' }),
  price:        z.number().min(0, { message: 'El precio no puede ser negativo' }),
});

// PUT / — reemplazo completo del tarifario
export const updateTariffSchema = z.object({
  kmRanges:     z.array(kmRangeBody).optional(),
  specialZones: z.array(specialZoneBody).optional(),
  extraRain:    z.number().min(0).optional(),
  isRaining:    z.boolean().optional(),
});

// PATCH /rain — encender/apagar plus por lluvia (+ monto opcional)
export const toggleRainSchema = z.object({
  isRaining: z.boolean(),
  extraRain: z.number().min(0).optional(),
});

// POST /zones  y  PUT /zones/:id
export const zoneSchema = specialZoneBody;

// POST /ranges  y  PUT /ranges/:id
export const rangeSchema = kmRangeBody;
