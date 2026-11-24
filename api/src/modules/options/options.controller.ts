import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendError, sendSucces } from '../../utils/response';
import * as service from './options.service';

export const listPublic = asyncHandler(async (_req: Request, res: Response) => sendSucces(res, await service.listOptions(true)));
export const listAdmin = asyncHandler(async (_req: Request, res: Response) => sendSucces(res, await service.listOptions()));
export const create = asyncHandler(async (req: Request, res: Response) => sendSucces(res, await service.createOption(req.body), 201));
export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.updateOption(req.params.id as string, req.body);
  return result ? sendSucces(res, result) : sendError(res, 'Ingrediente no encontrado', 404);
});
export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.toggleOption(req.params.id as string);
  return result ? sendSucces(res, result) : sendError(res, 'Ingrediente no encontrado', 404);
});
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteOption(req.params.id as string);
  return result ? sendSucces(res, result) : sendError(res, 'Ingrediente no encontrado', 404);
});
