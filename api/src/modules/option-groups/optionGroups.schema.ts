import { z } from 'zod';
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const groupOptionSchema = z.object({
  ingrediente: objectId,
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
  permiteCantidad: z.boolean().default(false),
  cantidadMaxima: z.number().int().min(1).default(1),
  precioEspecial: z.number().finite().min(0).nullable().optional(),
}).transform(option => ({ ...option, cantidadMaxima: option.permiteCantidad ? option.cantidadMaxima : 1 }));
const base = z.object({
  nombre: z.string().trim().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(['unico', 'multiple']).default('unico'),
  obligatorio: z.boolean().default(false),
  minimo: z.number().int().min(0).default(0),
  maximo: z.number().int().min(1).default(1),
  activo: z.boolean().default(true),
  ingredientes: z.array(groupOptionSchema).min(1),
});
export const groupSchema = base.superRefine((group, ctx) => {
  if (group.tipo === 'unico' && group.maximo !== 1) ctx.addIssue({ code: 'custom', path: ['maximo'], message: 'La selección única requiere máximo 1' });
  if (group.obligatorio && group.minimo < 1) ctx.addIssue({ code: 'custom', path: ['minimo'], message: 'Un paso obligatorio requiere mínimo 1' });
  if (group.maximo < group.minimo || group.maximo > group.ingredientes.length) ctx.addIssue({ code: 'custom', path: ['maximo'], message: 'Máximo incompatible con los ingredientes' });
  const ids = group.ingredientes.map(item => item.ingrediente);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['ingredientes'], message: 'No se puede repetir un ingrediente' });
});
// Los defaults son para crear; en PUT parcial preservar la configuración existente.
export const updateGroupSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().optional(),
  tipo: z.enum(['unico', 'multiple']).optional(),
  obligatorio: z.boolean().optional(),
  minimo: z.number().int().min(0).optional(),
  maximo: z.number().int().min(1).optional(),
  activo: z.boolean().optional(),
  ingredientes: z.array(groupOptionSchema).min(1).optional(),
});
