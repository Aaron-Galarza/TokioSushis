import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { BranchModel } from '../modules/branches/branch.model';
import { UserModel } from '../modules/users/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { sendError } from '../utils/response';

export type UserRole = 'admin' | 'encargado' | 'owner';

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return sendError(res, 'Falta configuración de seguridad', 500);

  const authorization = req.get('authorization') ?? '';
  const token = /^Bearer\s+(\S+)$/i.exec(authorization)?.[1];
  if (!token) return sendError(res, 'Acceso denegado', 401);

  let decoded: jwt.JwtPayload;
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || typeof payload.id !== 'string' || !mongoose.isValidObjectId(payload.id)) {
      return sendError(res, 'Token inválido', 401);
    }
    decoded = payload;
  } catch {
    return sendError(res, 'Token inválido o expirado', 401);
  }

  const user = await UserModel.findById(decoded.id).select('role branchId active').lean();
  if (!user || !user.active) return sendError(res, 'Cuenta deshabilitada o inexistente', 401);

  const branchId = user.role === 'owner' ? null : user.branchId?.toString() ?? null;
  if (user.role !== 'owner') {
    if (!branchId) return sendError(res, 'Cuenta sin sucursal asignada', 403);
    const branchActive = await BranchModel.exists({ _id: branchId, active: true });
    if (!branchActive) return sendError(res, 'Sucursal deshabilitada o inexistente', 403);
  }

  req.auth = { userId: user._id.toString(), role: user.role, branchId };
  if (branchId) req.branchId = branchId;
  next();
});

export const authorize = (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) return sendError(res, 'Acceso denegado', 401);
  if (!roles.includes(req.auth.role)) return sendError(res, 'Permisos insuficientes', 403);
  next();
};

export const staffAccess = [authenticate, authorize('admin', 'encargado')];
export const managerAccess = [authenticate, authorize('encargado')];

