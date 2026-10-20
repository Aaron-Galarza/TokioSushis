import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import { findActiveBranchBySlug, listActiveBranches } from './branch.service';

export const getPublicBranches = asyncHandler(async (_req: Request, res: Response) => {
  return sendSucces(res, await listActiveBranches());
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
