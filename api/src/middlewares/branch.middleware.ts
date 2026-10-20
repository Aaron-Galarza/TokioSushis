import { Request, Response, NextFunction } from 'express';
import { BranchModel } from '../modules/branches/branch.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendError } from '../utils/response';

// Public calls may choose a branch, but every resource is looked up again within it.
export const resolvePublicBranch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const slug = req.get('x-branch-slug')?.toLowerCase() ?? '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return sendError(res, 'Falta una sucursal válida', 400);
  }
  const branch = await BranchModel.findOne({ slug, active: true }).select('_id').lean();
  if (!branch) return sendError(res, 'Sucursal no encontrada', 404);
  req.branchId = branch._id.toString();
  next();
});

export const requireBranchId = (req: Request): string => {
  if (!req.branchId) throw new AppError(403, 'Sucursal no autorizada');
  return req.branchId;
};
