import { z } from 'zod';

const adicionalBaseSchema = z.object({
  title: z.string().min(1, 'El nombre del adicional es obligatorio'),
  price: z.number({ message: 'El precio debe ser un numero' }).min(0, 'El precio no puede ser negativo'),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'ID de categoria invalido').optional(),
  active: z.boolean().optional(),
});

export const createAdicionalSchema = adicionalBaseSchema;

export const updateAdicionalSchema = adicionalBaseSchema.partial();
