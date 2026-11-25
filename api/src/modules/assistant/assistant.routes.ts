import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { isAdmin } from '../../middlewares/auth.middleware';
import { assistantLimiter } from '../../middlewares/rateLimiter.middleware';
import { UserModel } from '../users/user.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { runAssistant } from './assistant.agent';
import { AssistantTask } from './assistant.task.model';
import { cancelTask, createTask, runTask } from './assistant.task.service';
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
  const reply = await runAssistant(req, parsed.data.message, parsed.data.history ?? [], async (operations, objective) => {
    const task = await createTask(userId(req), objective, operations);
    return task.id;
  });
  return sendSucces(res, reply);
}));

router.post('/confirm', asyncHandler(async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Confirmación inválida', 400);
  try {
    const task = await runTask(req, parsed.data.pendingId, userId(req));
    return sendSucces(res, { message: `Tarea ${task.status}.`, task });
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : 'No se pudo confirmar la tarea.', 409);
  }
}));

router.post('/cancel', asyncHandler(async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Acción inválida', 400);
  const task = await cancelTask(parsed.data.pendingId, userId(req));
  if (!task) return sendError(res, 'La tarea ya no está pendiente', 409);
  return sendSucces(res, { message: 'Acción cancelada.' });
}));

router.get('/tasks', asyncHandler(async (req, res) => {
  const tasks = await AssistantTask.find({ userId: userId(req) }).sort({ createdAt: -1 }).limit(20).lean();
  return sendSucces(res, { tasks });
}));

router.get('/tasks/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Tarea inválida', 400);
  const task = await AssistantTask.findOne({ _id: req.params.id, userId: userId(req) }).lean();
  if (!task) return sendError(res, 'Tarea no encontrada', 404);
  return sendSucces(res, { task });
}));

router.get('/usage', asyncHandler(async (_req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  const budget = Number(process.env.ASSISTANT_DAILY_TOKEN_BUDGET ?? 100_000);
  const usage = await mongoose.connection.db?.collection('assistant_usage_budget_v2').findOne({ date });
  const used = Number(usage?.usedTokens ?? 0);
  const reserved = Number(usage?.reservedTokens ?? 0);
  const remaining = Math.max(0, budget - used - reserved);
  return sendSucces(res, { budget, used, reserved, remaining, usedPercent: Math.min(100, (used / budget) * 100), date });
}));

export default router;
