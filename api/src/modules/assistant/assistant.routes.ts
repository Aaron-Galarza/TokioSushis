import { Router, Request, Response, NextFunction } from 'express';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { isAdmin } from '../../middlewares/auth.middleware';
import { assistantLimiter } from '../../middlewares/rateLimiter.middleware';
import { UserModel } from '../users/user.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { planOperation, Plan } from './llm.provider';
import { operationErrors, operationNames, operations, parseOperation } from './assistant.operations';
import { AssistantOperationError, executeOperation, prepareOperation, PreparedOperation, previewOperation } from './assistant.executor';

const ttl = () => new Date(Date.now() + 10 * 60 * 1000);
const draftSchema = new Schema({ userId: { type: String, required: true }, plan: Schema.Types.Mixed, expiresAt: { type: Date, required: true, index: { expires: 0 } } });
const pendingSchema = new Schema({ userId: { type: String, required: true }, operation: Schema.Types.Mixed, status: { type: String, enum: ['pending', 'claimed', 'cancelled'], default: 'pending' }, expiresAt: { type: Date, required: true, index: { expires: 0 } } }, { timestamps: true });
const Draft = mongoose.model('AssistantDraft', draftSchema);
const Pending = mongoose.model('AssistantPending', pendingSchema);
const router = Router();

router.use(isAdmin);
router.use(assistantLimiter);
router.use(asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || typeof user === 'string' || user.role !== 'admin' || !mongoose.isValidObjectId(user.id)) return sendError(res, 'Se requiere un administrador autorizado', 403);
  const admin = await UserModel.findOne({ _id: user.id, role: 'admin' }).select('_id').lean();
  if (!admin) return sendError(res, 'Se requiere un administrador autorizado', 403);
  next();
}));

const userId = (req: Request) => (req.user as { id: string }).id;
const messageSchema = z.object({ message: z.string().trim().min(1).max(500), draftId: z.string().regex(/^[a-f\d]{24}$/i).optional() });
const idSchema = z.object({ pendingId: z.string().regex(/^[a-f\d]{24}$/i) });
const mergeInput = (oldInput: Record<string, unknown>, newInput: Record<string, unknown>) => ({
  ...oldInput, ...newInput,
  ...(oldInput.body || newInput.body ? { body: { ...(oldInput.body as object || {}), ...(newInput.body as object || {}) } } : {}),
});

router.post('/message', asyncHandler(async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Mensaje inválido', 400);
  const { message, draftId } = parsed.data;
  const draft = draftId ? await Draft.findOne({ _id: draftId, userId: userId(req), expiresAt: { $gt: new Date() } }) : null;
  if (draft && /^(cancelar|olvidar|cancelá|olvidá)$/i.test(message)) {
    await draft.deleteOne();
    return sendSucces(res, { message: 'Borrador cancelado.' });
  }
  const previous = draft?.plan as Plan | undefined;
  const planned = await planOperation(message, previous);
  if (!planned) return sendSucces(res, { message: `No encontré una operación compatible. Puedo consultar productos, categorías, cupones, pedidos, ventas, envíos y estado del local; también preparar cambios para que los confirmes.`, ...(draft ? { draftId: draft.id } : {}) });
  const plan = previous && previous.operation === planned.operation ? { operation: planned.operation, input: mergeInput(previous.input, planned.input) } : planned;
  if (!operationNames.includes(plan.operation)) return sendError(res, 'Operación no autorizada', 400);
  const validated = parseOperation(plan.operation, plan.input);
  if (!validated) {
    const saved = draft || new Draft({ userId: userId(req) });
    saved.plan = plan;
    saved.expiresAt = ttl();
    await saved.save();
    return sendSucces(res, { message: `Necesito completar los datos de ${operations[plan.operation].description}: ${operationErrors(plan.operation, plan.input).join('; ')}.`, draftId: saved.id });
  }
  try {
    const operation = await prepareOperation(req, plan.operation, plan.input);
    if (draft) await draft.deleteOne();
    if (!operation.write) return sendSucces(res, { message: await executeOperation(req, operation) });
    const pending = await Pending.create({ userId: userId(req), operation, expiresAt: ttl() });
    return sendSucces(res, { message: previewOperation(operation), pendingId: pending.id });
  } catch (error) {
    if (error instanceof AssistantOperationError) return sendError(res, error.message, error.status);
    throw error;
  }
}));

router.post('/confirm', asyncHandler(async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Confirmación inválida', 400);
  const pending = await Pending.findOneAndUpdate(
    { _id: parsed.data.pendingId, userId: userId(req), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'claimed' } }, { new: true },
  );
  if (!pending) return sendError(res, 'La acción venció, fue cancelada o ya se procesó', 409);
  try {
    const message = await executeOperation(req, pending.operation as PreparedOperation);
    console.info('[assistant] operación completada', { userId: userId(req), pendingId: pending.id, operation: (pending.operation as PreparedOperation).name });
    return sendSucces(res, { message });
  } catch (error) {
    console.error('[assistant] no se pudo confirmar la operación', { userId: userId(req), pendingId: pending.id });
    return sendError(res, error instanceof AssistantOperationError ? `${error.message} Revisá el resultado antes de volver a intentar.` : 'No se pudo confirmar el resultado. Revisá los datos antes de volver a intentar.', error instanceof AssistantOperationError ? error.status : 500);
  }
}));

router.post('/cancel', asyncHandler(async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Acción inválida', 400);
  const pending = await Pending.findOneAndUpdate(
    { _id: parsed.data.pendingId, userId: userId(req), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'cancelled' } },
  );
  if (!pending) return sendError(res, 'La acción ya no está pendiente', 409);
  return sendSucces(res, { message: 'Acción cancelada.' });
}));

export default router;
