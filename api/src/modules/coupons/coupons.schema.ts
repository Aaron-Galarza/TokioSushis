import { z } from 'zod';

const couponBaseSchema = z.object({
  code: z.string().min(1, 'El codigo del cupon es obligatorio').optional(),
  Code: z.string().min(1, 'El codigo del cupon es obligatorio').optional(),
  discountPercent: z.number().min(1).max(100).optional(),
  Percent: z.number().min(1).max(100).optional(),
  active: z.boolean().optional(),
  validDays: z.array(z.string()).optional(),
  validPaymentMethods: z.array(z.enum(['cash', 'transfer', 'mercadopago', 'Efectivo', 'Transferencia'])).optional(),
});

export const createCouponSchema = couponBaseSchema
  .refine((data) => data.code || data.Code, {
    message: 'El codigo del cupon es obligatorio',
    path: ['code'],
  })
  .refine((data) => data.discountPercent !== undefined || data.Percent !== undefined, {
    message: 'El porcentaje es obligatorio',
    path: ['discountPercent'],
  });

export const updateCouponSchema = couponBaseSchema.partial();
