import { z } from 'zod';

export const updateBranchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  timezone: z.string().trim().min(1),
  phone: z.string().trim().max(50).optional(),
  whatsappPhone: z.string().trim().max(50).optional(),
  paymentMethods: z.array(z.enum(['cash', 'debito', 'credito', 'transferencia'])).min(1),
  transferAlias: z.string().trim().max(100).optional(),
  transferHolder: z.string().trim().max(100).optional(),
}).strict().superRefine((data, ctx) => {
  if (new Set(data.paymentMethods).size !== data.paymentMethods.length) {
    ctx.addIssue({ code: 'custom', message: 'Métodos de pago duplicados' });
  }
  if (data.paymentMethods.includes('transferencia') && (!data.transferAlias || !data.transferHolder)) {
    ctx.addIssue({ code: 'custom', message: 'Faltan datos de transferencia' });
  }
});
