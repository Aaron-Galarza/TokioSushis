import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import * as service from './optionGroups.service';

export const listPublic = asyncHandler(async (_req: Request, res: Response) => sendSucces(res, await service.listGroups(true)));
export const listAdmin = asyncHandler(async (_req: Request, res: Response) => sendSucces(res, await service.listGroups()));
export const create = asyncHandler(async (req: Request, res: Response) => sendSucces(res, await service.createGroup(req.body), 201));
export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.updateGroup(req.params.id as string, req.body);
  return result ? sendSucces(res, result) : sendError(res, 'Grupo no encontrado', 404);
});
export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.toggleGroup(req.params.id as string);
  return result ? sendSucces(res, result) : sendError(res, 'Grupo no encontrado', 404);
});
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteGroup(req.params.id as string);
  return result ? sendSucces(res, result) : sendError(res, 'Grupo no encontrado', 404);
});
