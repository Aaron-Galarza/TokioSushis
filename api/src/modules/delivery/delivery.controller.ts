import { Request, Response } from 'express';
import * as DeliveryService from './delivery.service';
import { DeliveryConfigModel } from './delivery.model';
import { sendError, sendSucces } from '../../utils/response';
import { AppError, friendlyAppErrorMessage } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const calculate = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    const delivery = await DeliveryService.calculateDelivery(Number(lat), Number(lng));
    return sendSucces(res, delivery);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, friendlyAppErrorMessage(error), error.statusCode);
    }
    console.error('[DELIVERY_ERROR]', error);
    return sendError(res, 'No pudimos calcular el envio en este momento', 503);
  }
};

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await DeliveryConfigModel.getOrCreateConfig();
  return sendSucces(res, config);
});

export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
  const { kmRanges, extraRain, isRaining } = req.body;
  const config = await DeliveryConfigModel.getOrCreateConfig();
  if (kmRanges  !== undefined)           config.kmRanges  = kmRanges;
  if (typeof extraRain === 'number')     config.extraRain = extraRain;
  if (typeof isRaining === 'boolean')    config.isRaining = isRaining;
  const saved = await config.save();
  return sendSucces(res, { data: saved, message: 'Configuración actualizada' });
});

export const toggleRain = asyncHandler(async (req: Request, res: Response) => {
  const { isRaining, extraRain } = req.body;
  const config = await DeliveryConfigModel.getOrCreateConfig();
  config.isRaining = isRaining;
  if (typeof extraRain === 'number') config.extraRain = extraRain;
  const saved = await config.save();
  return sendSucces(res, { data: { isRaining: saved.isRaining, extraRain: saved.extraRain }, message: 'Estado de lluvia actualizado' });
});

export const addRange = asyncHandler(async (req: Request, res: Response) => {
  const config = await DeliveryConfigModel.getOrCreateConfig();
  config.kmRanges.push(req.body);
  const saved = await config.save();
  return sendSucces(res, { data: saved.kmRanges, message: 'Rango agregado' });
});

export const deleteRange = asyncHandler(async (req: Request, res: Response) => {
  const config = await DeliveryConfigModel.getOrCreateConfig();
  const range = config.kmRanges.id(String(req.params.id));
  if (!range) return sendError(res, 'Rango no encontrado', 404);
  range.deleteOne();
  const saved = await config.save();
  return sendSucces(res, { data: saved.kmRanges, message: 'Rango eliminado' });
});