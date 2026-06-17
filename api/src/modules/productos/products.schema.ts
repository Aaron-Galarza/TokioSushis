import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1, 'El nombre del producto es obligatorio'),
  price: z.number({ message: 'El precio debe ser un numero' }).min(0, 'El precio no puede ser negativo'),
  description: z.string().min(1, 'La descripcion es obligatoria'),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'ID de categoria invalido'),
  image: z.string().optional(),
  active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();
