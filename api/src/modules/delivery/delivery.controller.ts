import { Request, Response } from 'express';
import * as DeliveryService from './delivery.service';
import { DeliveryConfigModel } from './delivery.model';
import { sendError, sendSucces } from '../../utils/response';
import { AppError } from '../../utils/AppError';

// ─── ENDPOINT PÚBLICO (Checkout Frontend) ─────────────────────────
export const calculate = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    // Forzamos el casteo numérico explícito antes de enviarlo al servicio
    const delivery = await DeliveryService.calculateDelivery(Number(lat), Number(lng));
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

// ─── ENDPOINTS ADMIN (Configuración) ──────────────────────────────
export const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await DeliveryConfigModel.getOrCreateConfig();
    return sendSucces(res, config);
  } catch {
    return sendError(res, 'Error al obtener la configuración de envío');
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { kmRanges, specialZones, extraRain, isRaining } = req.body;
    const config = await DeliveryConfigModel.getOrCreateConfig();

    if (kmRanges !== undefined) config.kmRanges = kmRanges;
    if (specialZones !== undefined) config.specialZones = specialZones;
    if (typeof extraRain === 'number') config.extraRain = extraRain;
    if (typeof isRaining === 'boolean') config.isRaining = isRaining;

    const saved = await config.save();
    return sendSucces(res, { data: saved, message: 'Configuración actualizada' });
  } catch {
    return sendError(res, 'Error al actualizar configuración');
  }
};

export const toggleRain = async (req: Request, res: Response) => {
  try {
    const { isRaining, extraRain } = req.body;
    const config = await DeliveryConfigModel.getOrCreateConfig();
    config.isRaining = isRaining;
    if (typeof extraRain === 'number') config.extraRain = extraRain;
    
    const saved = await config.save();
    return sendSucces(res, { data: { isRaining: saved.isRaining, extraRain: saved.extraRain }, message: 'Estado de lluvia actualizado' });
  } catch {
    return sendError(res, 'Error al actualizar el estado de lluvia');
  }
};

// ─── CRUD DE LISTAS ──────────────────────────────────────────────────────────
export const addZone = async (req: Request, res: Response) => {
  try {
    const config = await DeliveryConfigModel.getOrCreateConfig();
    config.specialZones.push(req.body);
    const saved = await config.save();
    return sendSucces(res, { data: saved.specialZones, message: 'Zona agregada' });
  } catch { return sendError(res, 'Error al agregar la zona'); }
};

export const deleteZone = async (req: Request, res: Response) => {
  try {
    const config = await DeliveryConfigModel.getOrCreateConfig();
    // Forzamos String(req.params.id) para quitar el warning de string[] o Buffer de Express
    const zone = config.specialZones.id(String(req.params.id));
    if (!zone) return sendError(res, 'Zona no encontrada', 404);
    zone.deleteOne();
    const saved = await config.save();
    return sendSucces(res, { data: saved.specialZones, message: 'Zona eliminada' });
  } catch { return sendError(res, 'Error al eliminar la zona'); }
};

export const addRange = async (req: Request, res: Response) => {
  try {
    const config = await DeliveryConfigModel.getOrCreateConfig();
    config.kmRanges.push(req.body);
    const saved = await config.save();
    return sendSucces(res, { data: saved.kmRanges, message: 'Rango agregado' });
  } catch { return sendError(res, 'Error al agregar el rango'); }
};

export const deleteRange = async (req: Request, res: Response) => {
  try {
    const config = await DeliveryConfigModel.getOrCreateConfig();
    // Forzamos String(req.params.id) para que Mongoose lo reconozca sin chillar tipos
    const range = config.kmRanges.id(String(req.params.id));
    if (!range) return sendError(res, 'Rango no encontrado', 404);
    range.deleteOne();
    const saved = await config.save();
    return sendSucces(res, { data: saved.kmRanges, message: 'Rango eliminado' });
  } catch { return sendError(res, 'Error al eliminar el rango'); }
};