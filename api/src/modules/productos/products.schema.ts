import { z } from 'zod';

const configOptionSchema = z.object({
  id: z.string().min(1, 'El id de la opción es obligatorio'),
  label: z.string().min(1, 'El nombre de la opción es obligatorio'),
  description: z.string().nullish(),
  price: z.number({ message: 'El precio de la opción debe ser un número' }).min(0, 'El precio no puede ser negativo').default(0),
  kind: z.enum(['selection', 'exclusion']).default('selection'),
  isExtra: z.boolean().nullish(),
  defaultSelected: z.boolean().nullish(),
  active: z.boolean().nullish(),
});

const configStepSchema = z.object({
  id: z.string().min(1, 'El id del paso es obligatorio'),
  label: z.string().min(1, 'El label del paso es obligatorio'),
  title: z.string().min(1, 'El título del paso es obligatorio'),
  description: z.string().nullish(),
  type: z.enum(['single', 'multiple']).default('single'),
  mode: z.enum(['absolute', 'delta']).default('delta'),
  min: z.number().int().min(0).default(0),
  max: z.number().int().min(0).default(0),
  required: z.boolean().default(false),
  options: z.array(configOptionSchema).default([]),
});

const configuratorSchema = z.object({
  enabled: z.boolean().default(false),
  key: z.string().default(''),
  steps: z.array(configStepSchema).default([]),
});

export const createProductSchema = z.object({
  title: z.string().min(1, 'El nombre del producto es obligatorio'),
  price: z.number({ message: 'El precio debe ser un numero' }).min(0, 'El precio no puede ser negativo'),
  description: z.string().min(1, 'La descripcion es obligatoria'),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'ID de categoria invalido'),
  image: z.string().optional(),
  active: z.boolean().optional(),
  controlStock: z.boolean().optional(),
  stock: z.number().min(0, 'El stock no puede ser negativo').optional(),
  configurator: configuratorSchema.optional(),
});

export const updateProductSchema = createProductSchema.partial();
export const updateProductStockSchema = z.object({ stock: z.number().int().min(0) }).strict();
