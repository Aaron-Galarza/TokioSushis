import { z } from 'zod';

export const createCategoriaSchema = z.object({
  name:   z.string().min(1, 'El nombre de la categoria es obligatorio'),
  order:  z.number().optional(),
  active: z.boolean().optional(),
  icon:   z.string().optional(),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();