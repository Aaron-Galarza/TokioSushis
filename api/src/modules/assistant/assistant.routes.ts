import { Router, Request, Response, NextFunction } from 'express';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { isAdmin } from '../../middlewares/auth.middleware';
import { assistantLimiter } from '../../middlewares/rateLimiter.middleware';
import { UserModel } from '../users/user.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { runAssistant } from './assistant.agent';
import { AssistantOperationError, executeOperation, PreparedOperation } from './assistant.executor';

const pendingSchema = new Schema({
  userId: { type: String, required: true },
  operation: Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'claimed', 'cancelled'], default: 'pending' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
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
const messageSchema = z.object({
  message: z.string().trim().min(1).max(500),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(800) })).max(6).optional(),
});
const idSchema = z.object({ pendingId: z.string().regex(/^[a-f\d]{24}$/i) });

router.post('/message', asyncHandler(async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Mensaje inválido', 400);
  const reply = await runAssistant(req, parsed.data.message, parsed.data.history ?? [], async (operation) => {
    const pending = await Pending.create({ userId: userId(req), operation, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    return pending.id;
  });
  return sendSucces(res, reply);
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
