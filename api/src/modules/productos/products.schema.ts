import { z } from 'zod';

const baseProductSchema = z.object({
  title: z.string().min(1, 'El nombre del producto es obligatorio'),
  price: z.number({ message: 'El precio debe ser un numero' }).min(0, 'El precio no puede ser negativo'),
  description: z.string().min(1, 'La descripcion es obligatoria'),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'ID de categoria invalido'),
  image: z.string().optional(),
  active: z.boolean().optional(),
  controlStock: z.boolean().optional(),
  stock: z.number().min(0, 'El stock no puede ser negativo').optional(),
  tipoProducto: z.enum(['simple', 'configurable']).optional(),
  gruposOpciones: z.array(z.object({
    grupo: z.string().regex(/^[a-f\d]{24}$/i),
    orden: z.number().int().default(0),
    obligatorio: z.boolean().nullable().optional(),
    minimo: z.number().int().min(0).nullable().optional(),
    maximo: z.number().int().min(1).nullable().optional(),
    ingredientes: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
  })).optional(),
});

export const createProductSchema = baseProductSchema.superRefine((product, ctx) => {
  if (product.tipoProducto === 'configurable' && !product.gruposOpciones?.length) {
    ctx.addIssue({ code: 'custom', path: ['gruposOpciones'], message: 'Elegí al menos un grupo para el producto configurable' });
  }
  const ids = product.gruposOpciones?.map(item => item.grupo) ?? [];
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['gruposOpciones'], message: 'No se puede repetir un grupo' });
});

export const updateProductSchema = baseProductSchema.partial();
