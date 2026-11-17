import { Router, Request, Response, NextFunction } from 'express';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { isAdmin } from '../../middlewares/auth.middleware';
import { UserModel } from '../users/user.model';
import * as coupons from '../coupons/coupons.services';
import * as products from '../productos/products.service';
import { createCouponSchema } from '../coupons/coupons.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { runAssistantTool, AssistantToolName } from './assistant.tools';
import { tryGeminiRead } from './llm.provider';

const pendingSchema = new Schema({
  userId: { type: String, required: true },
  code: { type: String, required: true },
  discountPercent: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'claimed', 'cancelled'], default: 'pending' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
const Pending = mongoose.model('AssistantPending', pendingSchema);
const draftSchema = new Schema({
  userId: { type: String, required: true },
  code: String,
  discountPercent: Number,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
const Draft = mongoose.model('AssistantDraft', draftSchema);
const router = Router();
router.use(isAdmin);
router.use(asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || typeof user === 'string' || user.role !== 'admin' || !mongoose.isValidObjectId(user.id)) {
    return sendError(res, 'Se requiere un administrador autorizado', 403);
  }
  const admin = await UserModel.findOne({ _id: user.id, role: 'admin' }).select('_id').lean();
  if (!admin) return sendError(res, 'Se requiere un administrador autorizado', 403);
  next();
}));
const userId = (req: Request) => (req.user as { id: string }).id;
const messageSchema = z.object({ message: z.string().trim().min(1).max(500), draftId: z.string().regex(/^[a-f\d]{24}$/i).optional() });
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const toolResponse = async (tool: AssistantToolName, context: { rangeDays?: number }) => {
  const result = await runAssistantTool(tool, context) as any;
  if (tool === 'list_products') return result.length
    ? result.map((row: any) => `${row.title}: $${row.price} (${row.active ? 'activo' : 'inactivo'})`).join('\n')
    : 'No hay productos.';
  if (tool === 'list_categories') return result.length
    ? result.map((row: any) => `${row.name} (${row.active ? 'activa' : 'inactiva'})`).join('\n')
    : 'No hay categorías.';
  if (tool === 'list_coupons') return result.length
    ? result.map((row: any) => `${row.code}: ${row.discountPercent}% (${row.active ? 'activo' : 'inactivo'})`).join('\n')
    : 'No hay cupones.';
  if (tool === 'get_orders_summary') return `En los últimos ${result.rangeDays} días hubo ${result.orders} pedidos: ${result.delivered} entregados, ${result.pending} pendientes, ${result.inPreparation} en preparación, ${result.ready} listos y ${result.cancelled} cancelados.`;
  if (tool === 'get_sales_summary') return `En los últimos ${result.rangeDays} días se vendieron $${result.revenue.toLocaleString('es-AR')} en ${result.orders} pedidos entregados. Ticket promedio: $${result.averageTicket.toLocaleString('es-AR')}.`;
  return result.length ? result.map((row: any, index: number) => `${index + 1}. ${row.title}: ${row.quantity} unidades`).join('\n') : 'No hay ventas entregadas en el período.';
};
router.post('/message', asyncHandler(async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Mensaje inválido', 400);
  const message = parsed.data.message;
  const normalized = normalize(message);
  const isRead = /\b(list|mostr|consult|ver|cuales|que|cuanto|cuanta|compar|resum|ventas|vendio|vendio|pedidos|pedido|productos|producto|categorias|categorias|cupon|horario)\w*/.test(normalized);
  if (isRead && !/crea|crear|agrega|gener|hac[eé]|nuevo/.test(normalized)) {
    const days = /hoy|dia/.test(normalized) ? 1 : /mes|30/.test(normalized) ? 30 : /90|trimestre/.test(normalized) ? 90 : 7;
    const context = { rangeDays: days };
    try {
      const modelAnswer = await tryGeminiRead(message, context);
      if (modelAnswer) return sendSucces(res, { message: modelAnswer, provider: 'gemini', rangeDays: days });
    } catch (error) {
      console.warn('[assistant] Gemini no disponible, se usa el lector determinista', error instanceof Error ? error.message : 'unknown error');
    }
    let tool: AssistantToolName;
    if (/cupon|promocion/.test(normalized)) tool = 'list_coupons';
    else if (/categor/.test(normalized)) tool = 'list_categories';
    else if (/producto|menu/.test(normalized) && !/top|mas vendido|estrella/.test(normalized)) tool = 'list_products';
    else if (/top|mas vendido|estrella/.test(normalized)) tool = 'get_top_products';
    else if (/venta|vendio|ingreso|factur|recaud/.test(normalized)) tool = 'get_sales_summary';
    else if (/pedido|orden/.test(normalized)) tool = 'get_orders_summary';
    else tool = 'get_sales_summary';
    const toolMessage = await toolResponse(tool, context);
    return sendSucces(res, { message: toolMessage, tool, rangeDays: days });
  }
  const creating = /crea|agrega|gener|hac[eé]/.test(normalized) && /cupon/.test(normalized);
  let draft = !creating && parsed.data.draftId
    ? await Draft.findOne({ _id: parsed.data.draftId, userId: userId(req), expiresAt: { $gt: new Date() } })
    : null;
  if (creating || draft) {
    if (/cancel|olvid/.test(normalized) && draft) {
      await draft.deleteOne();
      return sendSucces(res, { message: 'Borrador cancelado.' });
    }
    const codeMatch = normalized.match(/(?:cupon|codigo)\s+(?:codigo\s+)?([a-z0-9_-]+)/i);
    let code = codeMatch?.[1];
    if (code && /^(con|de|del|para|un|una|por|que)$/i.test(code)) code = undefined;
    const percentMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por\s+ciento)/);
    let percent = percentMatch ? Number(percentMatch[1].replace(',', '.')) : undefined;
    if (draft && !creating) {
      if (!draft.code && !code && /^[a-z0-9_-]{1,40}$/i.test(message.trim()) && !/^\d+$/.test(message.trim())) code = message.trim();
      if (draft.discountPercent == null && percent === undefined && /^\d+(?:[.,]\d+)?$/.test(message.trim())) percent = Number(message.trim().replace(',', '.'));
    }
    if (percent !== undefined && (percent < 1 || percent > 100)) {
      return sendSucces(res, { message: 'El porcentaje debe estar entre 1 y 100. Indicá otro valor.', ...(draft ? { draftId: draft.id } : {}) });
    }
    if (code && !/^[a-z0-9_-]{1,40}$/i.test(code)) return sendError(res, 'Código inválido', 400);
    if (!draft) draft = new Draft({ userId: userId(req), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    if (code) draft.code = code.toUpperCase();
    if (percent !== undefined) draft.discountPercent = percent;
    if (!draft.code || draft.discountPercent == null) {
      await draft.save();
      const missing = !draft.code && draft.discountPercent == null ? 'el código y el porcentaje' : !draft.code ? 'el código' : 'el porcentaje';
      return sendSucces(res, { message: `Para preparar el cupón global necesito ${missing}. Podés indicarlo en tu próximo mensaje.`, draftId: draft.id });
    }
    const payload = { code: draft.code, discountPercent: draft.discountPercent };
    const valid = createCouponSchema.safeParse(payload);
    if (!valid.success) return sendError(res, 'Código o porcentaje inválido', 400);
    const existing = await coupons.viewAll();
    if (existing.some(c => c.code === payload.code)) {
      await draft.deleteOne();
      return sendSucces(res, { message: 'Ya existe un cupón con ese código. Pedí uno nuevo con otro código.' });
    }
    const pending = await Pending.create({ userId: userId(req), ...payload, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    if (!draft.isNew) await draft.deleteOne();
    return sendSucces(res, { message: `Crear cupón global ${payload.code} con ${payload.discountPercent}% de descuento. ¿Confirmás?`, pendingId: pending.id });
  }
  return sendSucces(res, { message: 'Puedo consultar productos, categorías, cupones, pedidos, ventas y productos más vendidos. También puedo preparar un cupón para confirmación. Ejemplos: «¿cuánto vendimos esta semana?» o «mostrame los productos más vendidos».' });
}));
const idSchema = z.object({ pendingId: z.string().regex(/^[a-f\d]{24}$/i) });
router.post('/confirm', asyncHandler(async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Confirmación inválida', 400);
  const pending = await Pending.findOneAndUpdate(
    { _id: parsed.data.pendingId, userId: userId(req), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'claimed' } }, { new: true }
  );
  if (!pending) return sendError(res, 'La acción venció, fue cancelada o ya se procesó', 409);
  const valid = createCouponSchema.safeParse({ code: pending.code, discountPercent: pending.discountPercent });
  if (!valid.success || !/^[A-Z0-9_-]{1,40}$/.test(pending.code)) return sendError(res, 'La acción ya no es válida', 400);
  try {
    const coupon = await coupons.create(valid.data);
    console.info('[assistant] cupón creado', { userId: userId(req), pendingId: pending.id, couponCode: coupon.code });
    return sendSucces(res, { message: `Listo, el cupón global ${coupon.code} fue creado correctamente.` });
  } catch (error: unknown) {
    console.error('[assistant] error al crear cupón', { userId: userId(req), pendingId: pending.id });
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return sendError(res, 'Ya existe un cupón con ese código', 409);
    }
    return sendError(res, 'No se pudo confirmar el resultado. Revisá los cupones antes de volver a intentar.', 500);
  }
}));
router.post('/cancel', asyncHandler(async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Acción inválida', 400);
  const pending = await Pending.findOneAndUpdate(
    { _id: parsed.data.pendingId, userId: userId(req), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'cancelled' } }
  );
  if (!pending) return sendError(res, 'La acción ya no está pendiente', 409);
  return sendSucces(res, { message: 'Acción cancelada.' });
}));
export default router;
