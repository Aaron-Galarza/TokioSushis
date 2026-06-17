import { Request, Response } from 'express';
import * as ConfigService from './Schedule.service';
import { sendSucces, sendError } from '../../utils/response';

export const getStatus = async (req: Request, res: Response) => {
    try {
        const status = await ConfigService.checkStoreStatus();
        return sendSucces(res, status);
    } catch (error) {
        return sendError(res, "Error al consultar el estado del local");
    }
};

export const closeStore = async (req: Request, res: Response) => {
    try {
        const status = await ConfigService.closeStore()
        return sendSucces(res, status) 
    } catch (error) {
        return sendError(res, 'Error al cambiar la disponibilidad del negocio')
    }
}

export const updateDelivery = async (req: Request, res: Response) => {
    try {
        const { pricePerKm } = req.body
        if (typeof pricePerKm !== 'number' || pricePerKm < 0) {
            return sendError(res, 'pricePerKm debe ser un numero positivo', 400)
        }

        const config = await ConfigService.updateDelivery(pricePerKm)
        return sendSucces(res, config)
    } catch (error) {
        return sendError(res, 'Error al actualizar el costo de envio')
    }
}

export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const raw = req.body?.dailySchedule ?? req.body?.schedule ?? req.body

        // Accept a single day object or an array of days
        const updates = Array.isArray(raw) ? raw : [raw]

        if (!updates.length || !updates[0]?.day) {
            return sendError(res, 'Debes enviar al menos un día con su configuración', 400)
        }

        const config = await ConfigService.updateSchedule(updates)
        return sendSucces(res, config)
    } catch (error) {
        return sendError(res, 'Error al actualizar los horarios')
    }
}
