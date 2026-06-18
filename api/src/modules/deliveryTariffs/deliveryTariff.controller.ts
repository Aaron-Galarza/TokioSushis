import { Request, Response } from 'express';
import { DeliveryTariffModel } from './deliveryTariff.model';
import { sendSucces, sendError } from '../../utils/response';

// GET /api/delivery-tariffs
export const getTariffs = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    return sendSucces(res, tariff);
  } catch {
    return sendError(res, 'Error al obtener el esquema de tarifas de envío');
  }
};

// PUT /api/delivery-tariffs — reemplazo completo de rangos y/o zonas
export const updateTariffs = async (req: Request, res: Response) => {
  try {
    const { kmRanges, specialZones, extraRain, isRaining } = req.body;
    const tariff = await DeliveryTariffModel.getOrCreateTariff();

    if (kmRanges     !== undefined) tariff.kmRanges     = kmRanges;
    if (specialZones !== undefined) tariff.specialZones = specialZones;
    if (typeof extraRain  === 'number')  tariff.extraRain  = extraRain;
    if (typeof isRaining  === 'boolean') tariff.isRaining  = isRaining;

    const saved = await tariff.save();
    return sendSucces(res, saved, 'Tarifario actualizado');
  } catch {
    return sendError(res, 'Error al actualizar el tarifario');
  }
};

// PATCH /api/delivery-tariffs/rain — toggle rápido del plus por lluvia
export const toggleRain = async (req: Request, res: Response) => {
  try {
    const { isRaining, extraRain } = req.body;
    const tariff = await DeliveryTariffModel.getOrCreateTariff();

    tariff.isRaining = isRaining;
    if (typeof extraRain === 'number') tariff.extraRain = extraRain;

    const saved = await tariff.save();
    return sendSucces(res, { isRaining: saved.isRaining, extraRain: saved.extraRain }, 'Estado de lluvia actualizado');
  } catch {
    return sendError(res, 'Error al actualizar el estado de lluvia');
  }
};

// ─── Zonas especiales ────────────────────────────────────────────────────────

// POST /api/delivery-tariffs/zones
export const addZone = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    tariff.specialZones.push(req.body);
    const saved = await tariff.save();
    return sendSucces(res, saved.specialZones, 'Zona agregada');
  } catch {
    return sendError(res, 'Error al agregar la zona');
  }
};

// PUT /api/delivery-tariffs/zones/:id
export const updateZone = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    const zone = tariff.specialZones.id(req.params.id);
    if (!zone) return sendError(res, 'Zona no encontrada', 404);

    Object.assign(zone, req.body);
    const saved = await tariff.save();
    return sendSucces(res, saved.specialZones, 'Zona actualizada');
  } catch {
    return sendError(res, 'Error al actualizar la zona');
  }
};

// DELETE /api/delivery-tariffs/zones/:id
export const deleteZone = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    const zone = tariff.specialZones.id(req.params.id);
    if (!zone) return sendError(res, 'Zona no encontrada', 404);

    zone.deleteOne();
    const saved = await tariff.save();
    return sendSucces(res, saved.specialZones, 'Zona eliminada');
  } catch {
    return sendError(res, 'Error al eliminar la zona');
  }
};

// ─── Rangos por kilómetro ─────────────────────────────────────────────────────

// POST /api/delivery-tariffs/ranges
export const addRange = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    tariff.kmRanges.push(req.body);
    const saved = await tariff.save(); // el pre-save hook ordena el array
    return sendSucces(res, saved.kmRanges, 'Rango agregado');
  } catch {
    return sendError(res, 'Error al agregar el rango');
  }
};

// PUT /api/delivery-tariffs/ranges/:id
export const updateRange = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    const range = tariff.kmRanges.id(req.params.id);
    if (!range) return sendError(res, 'Rango no encontrado', 404);

    Object.assign(range, req.body);
    const saved = await tariff.save();
    return sendSucces(res, saved.kmRanges, 'Rango actualizado');
  } catch {
    return sendError(res, 'Error al actualizar el rango');
  }
};

// DELETE /api/delivery-tariffs/ranges/:id
export const deleteRange = async (req: Request, res: Response) => {
  try {
    const tariff = await DeliveryTariffModel.getOrCreateTariff();
    const range = tariff.kmRanges.id(req.params.id);
    if (!range) return sendError(res, 'Rango no encontrado', 404);

    range.deleteOne();
    const saved = await tariff.save();
    return sendSucces(res, saved.kmRanges, 'Rango eliminado');
  } catch {
    return sendError(res, 'Error al eliminar el rango');
  }
};
