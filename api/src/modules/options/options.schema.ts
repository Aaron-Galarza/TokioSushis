import { z } from 'zod';

export const optionSchema = z.object({
  nombre: z.string().trim().min(1),
  descripcion: z.string().optional(),
  precio: z.number().finite().min(0).default(0),
  activo: z.boolean().default(true),
  disponible: z.boolean().default(true),
  orden: z.number().int().default(0),
});
// En una edición parcial, los campos omitidos no deben recibir los defaults de alta.
export const updateOptionSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  precio: z.number().finite().min(0).optional(),
  activo: z.boolean().optional(),
  disponible: z.boolean().optional(),
  orden: z.number().int().optional(),
});
