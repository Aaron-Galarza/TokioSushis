import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { BranchModel } from '../branches/branch.model';
import { UserModel } from '../users/user.model';
import { ConfigModel, initialDailySchedule } from '../Schedules/Schedule.module';
import { DeliveryConfigModel, initialKmRanges } from '../delivery/delivery.model';
import { updateBranchSchema } from '../branches/branch.schema';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  address: z.string().trim().min(3).max(200),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  timezone: z.string().trim().min(1).default('America/Argentina/Buenos_Aires'),
  phone: z.string().trim().max(50).default(''),
  whatsappPhone: z.string().trim().max(50).default(''),
  paymentMethods: z.array(z.enum(['cash', 'debito', 'credito', 'transferencia'])).min(1).default(['cash', 'debito', 'credito']),
  transferAlias: z.string().trim().max(100).default(''),
  transferHolder: z.string().trim().max(100).default(''),
  copyCatalogFrom: objectId.optional(),
}).strict().superRefine((data, ctx) => {
  try { new Intl.DateTimeFormat('en-US', { timeZone: data.timezone }); }
  catch { ctx.addIssue({ code: 'custom', path: ['timezone'], message: 'Zona horaria inválida' }); }
  if (new Set(data.paymentMethods).size !== data.paymentMethods.length) ctx.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'Métodos de pago duplicados' });
  if (data.paymentMethods.includes('transferencia') && (!data.transferAlias || !data.transferHolder)) ctx.addIssue({ code: 'custom', path: ['transferAlias'], message: 'Completá los datos de transferencia' });
});
const staffSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  role: z.enum(['admin', 'encargado']),
  branchId: objectId,
}).strict();
const staffUpdateSchema = z.object({
  role: z.enum(['admin', 'encargado']).optional(),
  branchId: objectId.optional(),
  active: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0);

const issueInvite = () => {
  const token = randomBytes(32).toString('hex');
  return { token, inviteTokenHash: createHash('sha256').update(token).digest('hex'),
    inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) };
};
const isDuplicate = (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

export const management = asyncHandler(async (_req: Request, res: Response) => {
  const [branches, users] = await Promise.all([
    BranchModel.find().select('name slug address coordinates timezone phone whatsappPhone paymentMethods transferAlias transferHolder active').sort({ name: 1 }).lean(),
    UserModel.find({ role: { $in: ['admin', 'encargado'] } }).select('email role branchId active +inviteExpiresAt').sort({ email: 1 }).lean(),
  ]);
  return sendSucces(res, { branches: branches.map((branch) => ({ id: branch._id.toString(), name: branch.name,
    slug: branch.slug, address: branch.address, coordinates: branch.coordinates, timezone: branch.timezone,
    phone: branch.phone ?? '', whatsappPhone: branch.whatsappPhone ?? '', paymentMethods: branch.paymentMethods ?? ['cash'],
    transferAlias: branch.transferAlias ?? '', transferHolder: branch.transferHolder ?? '', active: branch.active })),
    users: users.map((user) => ({ id: user._id.toString(), email: user.email, role: user.role,
      branchId: user.branchId?.toString() ?? '', active: user.active,
      invitationPending: !user.active && Boolean(user.inviteExpiresAt),
      invitationExpired: Boolean(user.inviteExpiresAt && user.inviteExpiresAt < new Date()) })) });
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Sucursal inválida', 400);
  const parsed = updateBranchSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Datos de sucursal inválidos', 400);
  try { new Intl.DateTimeFormat('en-US', { timeZone: parsed.data.timezone }); }
  catch { return sendError(res, 'Zona horaria inválida', 400); }
  const branch = await BranchModel.findByIdAndUpdate(req.params.id, { $set: parsed.data },
    { returnDocument: 'after', runValidators: true }).select('name slug');
  if (!branch) return sendError(res, 'Sucursal no encontrada', 404);
  return sendSucces(res, { id: branch.id, name: branch.name, slug: branch.slug });
});

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Datos de sucursal inválidos', 400);
  const { copyCatalogFrom, ...data } = parsed.data;
  const session = await mongoose.startSession();
  let result: { id: string; name: string; slug: string; copied: { categories: number; products: number; addons: number } } | null = null;
  try {
    await session.withTransaction(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error('Base de datos no disponible');
      const sourceId = copyCatalogFrom ? new mongoose.Types.ObjectId(copyCatalogFrom) : null;
      if (sourceId && !await BranchModel.exists({ _id: sourceId, active: true }).session(session)) {
        throw new Error('La sucursal de origen no existe o está inactiva');
      }
      const branch = new BranchModel({ ...data, active: true });
      branch.galleryFolder = `TokyoSushis/branches/${branch._id}`;
      await branch.save({ session });
      await ConfigModel.create([{ branchId: branch._id, dailySchedule: initialDailySchedule }], { session });
      await DeliveryConfigModel.create([{ branchId: branch._id, extraRain: 1000, isRaining: false, kmRanges: initialKmRanges }], { session });

      const copied = { categories: 0, products: 0, addons: 0 };
      if (sourceId) {
        const categories = await db.collection('categorias').find({ branchId: sourceId }, { session }).toArray();
        const products = await db.collection('productos').find({ branchId: sourceId }, { session }).toArray();
        const addons = await db.collection('adicionals').find({ branchId: sourceId }, { session }).toArray();
        const categoryIds = new Map(categories.map((category) => [category._id.toString(), new mongoose.Types.ObjectId()]));
        if (products.some((product) => !categoryIds.has(product.category?.toString()))
          || addons.some((addon) => (addon.categories ?? []).some((id: mongoose.Types.ObjectId) => !categoryIds.has(id.toString())))) {
          throw new Error('El catálogo de origen tiene categorías faltantes');
        }
        const clone = (doc: any, id: mongoose.Types.ObjectId, fields: Record<string, unknown> = {}) => {
          const { _id, branchId, createdAt, updatedAt, __v, legacyOrphanCategoryIds, ...rest } = doc;
          return { ...rest, ...fields, _id: id, branchId: branch._id, createdAt: new Date(), updatedAt: new Date() };
        };
        if (categories.length) await db.collection('categorias').insertMany(categories.map((category) => clone(category, categoryIds.get(category._id.toString())!)), { session });
        if (products.length) await db.collection('productos').insertMany(products.map((product) => clone(product, new mongoose.Types.ObjectId(), { category: categoryIds.get(product.category.toString()) })), { session });
        if (addons.length) await db.collection('adicionals').insertMany(addons.map((addon) => clone(addon, new mongoose.Types.ObjectId(), { categories: (addon.categories ?? []).map((id: mongoose.Types.ObjectId) => categoryIds.get(id.toString())) })), { session });
        copied.categories = categories.length;
        copied.products = products.length;
        copied.addons = addons.length;
      }
      result = { id: branch._id.toString(), name: branch.name, slug: branch.slug, copied };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } catch (error) {
    if (isDuplicate(error)) return sendError(res, 'Ya existe una sucursal con ese identificador', 409);
    if (error instanceof Error && /origen|catálogo/.test(error.message)) return sendError(res, error.message, 400);
    throw error;
  } finally { await session.endSession(); }
  return sendSucces(res, result, 201);
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Datos de usuario inválidos', 400);
  const branch = await BranchModel.findOne({ _id: parsed.data.branchId, active: true }).select('_id').lean();
  if (!branch) return sendError(res, 'Sucursal inexistente o inactiva', 404);
  const invite = issueInvite();
  try {
    const user = await UserModel.create({ email: parsed.data.email, role: parsed.data.role,
      branchId: branch._id, active: false, passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
      inviteTokenHash: invite.inviteTokenHash, inviteExpiresAt: invite.inviteExpiresAt });
    return sendSucces(res, { id: user.id, email: user.email, role: user.role, branchId: branch._id.toString(),
      inviteToken: invite.token, inviteExpiresAt: invite.inviteExpiresAt }, 201);
  } catch (error) {
    if (isDuplicate(error)) return sendError(res, 'Ya existe una cuenta con ese correo', 409);
    throw error;
  }
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Usuario inválido', 400);
  const parsed = staffUpdateSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Cambios inválidos', 400);
  const user = await UserModel.findOne({ _id: req.params.id, role: { $in: ['admin', 'encargado'] } }).select('+inviteTokenHash');
  if (!user) return sendError(res, 'Usuario no encontrado', 404);
  if (parsed.data.branchId && parsed.data.branchId !== user.branchId?.toString()) {
    const branch = await BranchModel.exists({ _id: parsed.data.branchId, active: true });
    if (!branch) return sendError(res, 'Sucursal inexistente o inactiva', 404);
  }
  if (parsed.data.active === true && user.inviteTokenHash) return sendError(res, 'La invitación debe aceptarse antes de activar la cuenta', 409);
  if (parsed.data.active === true && !await BranchModel.exists({ _id: parsed.data.branchId ?? user.branchId, active: true })) {
    return sendError(res, 'No se puede activar una cuenta de una sucursal inactiva', 409);
  }
  user.set(parsed.data);
  await user.save();
  return sendSucces(res, { id: user.id, email: user.email, role: user.role,
    branchId: user.branchId?.toString(), active: user.active });
});

export const renewInvite = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Usuario inválido', 400);
  const invite = issueInvite();
  const user = await UserModel.findOneAndUpdate(
    { _id: req.params.id, role: { $in: ['admin', 'encargado'] }, active: false, inviteTokenHash: { $exists: true } },
    { $set: { inviteTokenHash: invite.inviteTokenHash, inviteExpiresAt: invite.inviteExpiresAt } },
    { returnDocument: 'after' },
  ).select('email');
  if (!user) return sendError(res, 'La cuenta no tiene una invitación pendiente', 409);
  return sendSucces(res, { email: user.email, inviteToken: invite.token, inviteExpiresAt: invite.inviteExpiresAt });
});
