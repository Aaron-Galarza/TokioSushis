import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import * as UserService from './user.services'
import { UserModel } from './user.model'
import { BranchModel } from '../branches/branch.model'
import { sendError, sendSucces } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return sendError(res, 'Email y contraseña son obligatorios', 400)
  }

  const user = await UserService.findByEmail(email)
  if (!user || !user.active) {
    return sendError(res, 'Credenciales inválidas', 401)
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    return sendError(res, 'Credenciales inválidas', 401)
  }

  const branch = user.role === 'owner' ? null : await BranchModel.findOne({
    _id: user.branchId,
    active: true,
  }).select('name slug').lean();
  if (user.role !== 'owner' && !branch) {
    return sendError(res, 'Cuenta sin sucursal activa', 403)
  }

  const token = jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET!,
    { expiresIn: '4h' }
  )

  return res.json({ success: true, data: {
    message: 'Bienvenido', token, role: user.role,
    branch: branch ? { id: branch._id.toString(), name: branch.name, slug: branch.slug } : null,
  } })
})

export const me = asyncHandler(async (req: Request, res: Response) => {
  const branch = req.auth?.branchId
    ? await BranchModel.findById(req.auth.branchId).select('name slug').lean()
    : null;
  return sendSucces(res, {
    role: req.auth?.role,
    branch: branch ? { id: branch._id.toString(), name: branch.name, slug: branch.slug } : null,
  });
});

const acceptInviteSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(12).max(128),
}).strict();

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Invitación o contraseña inválida (mínimo 12 caracteres)', 400);
  const inviteTokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await UserModel.findOneAndUpdate(
    { inviteTokenHash, inviteExpiresAt: { $gt: new Date() }, active: false },
    { $set: { passwordHash, active: true }, $unset: { inviteTokenHash: '', inviteExpiresAt: '' } },
    { returnDocument: 'after' },
  ).select('email role');
  if (!user) return sendError(res, 'La invitación venció o ya fue utilizada', 409);
  return sendSucces(res, { email: user.email, role: user.role });
});
