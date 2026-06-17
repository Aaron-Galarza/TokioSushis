import { Request, Response } from 'express';
import * as DeliveryService from './delivery.service';
import { sendError, sendSucces } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export const calculate = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    const delivery = await DeliveryService.calculateDelivery(lat, lng);
    return sendSucces(res, delivery);
  } catch (error) {
    if (error instanceof AppError) {
      const status = error.statusCode === 503 ? 503 : error.statusCode;
      const message = status === 503 ? 'No pudimos calcular el envio en este momento' : error.message;
      return sendError(res, message, status);
    }

    console.error('[DELIVERY_ERROR]', error);
    return sendError(res, 'No pudimos calcular el envio en este momento', 503);
  }
};
