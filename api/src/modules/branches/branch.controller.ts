import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { findActiveBranchBySlug, listActiveBranches } from './branch.service';
import { BranchModel } from './branch.model';
import { requireBranchId } from '../../middlewares/branch.middleware';

export const getPublicBranches = asyncHandler(async (_req: Request, res: Response) => {
  return sendSucces(res, await listActiveBranches());
});

export const getManagedBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchModel.findById(requireBranchId(req))
    .select('name slug address coordinates timezone phone whatsappPhone paymentMethods transferAlias transferHolder').lean();
  if (!branch) return sendError(res, 'Sucursal no encontrada', 404);
  return sendSucces(res, branch);
});

export const updateManagedBranch = asyncHandler(async (req: Request, res: Response) => {
  try { new Intl.DateTimeFormat('en-US', { timeZone: req.body.timezone }); }
  catch { return sendError(res, 'Zona horaria inválida', 400); }
  const branch = await BranchModel.findByIdAndUpdate(requireBranchId(req), { $set: req.body },
    { returnDocument: 'after', runValidators: true })
    .select('name slug address coordinates timezone phone whatsappPhone paymentMethods transferAlias transferHolder');
  if (!branch) return sendError(res, 'Sucursal no encontrada', 404);
  return sendSucces(res, branch);
});

export const getPublicBranch = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug ?? '').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return sendError(res, 'Sucursal no encontrada', 404);
  }

  const branch = await findActiveBranchBySlug(slug);
  if (!branch) return sendError(res, 'Sucursal no encontrada', 404);

  return sendSucces(res, branch);
});
