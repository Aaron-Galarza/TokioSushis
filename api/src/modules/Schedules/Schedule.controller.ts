import { Request, Response } from 'express';
import * as ConfigService from './Schedule.service';
import { ConfigModel } from './Schedule.module';
import { sendSucces, sendError } from '../../utils/response';

export const getStatus = async (req: Request, res: Response) => {
    try {
        const status = await ConfigService.checkStoreStatus();
        return sendSucces(res, status);
    } catch (error) {
        return sendError(res, "Error al consultar el estado del local");
    }
};

export const getAdminConfig = async (req: Request, res: Response) => {
    try {
        const config = await ConfigModel.getOrCreateConfig();
        return sendSucces(res, config);
    } catch (error) {
        return sendError(res, "Error al consultar la configuración completa para el administrador");
    }
};

export const closeStore = async (req: Request, res: Response) => {
    try {
        const status = await ConfigService.closeStore();
        return sendSucces(res, status);
    } catch (error) {
        return sendError(res, 'Error al cambiar la disponibilidad del negocio');
    }
};

export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const raw = req.body?.dailySchedule ?? req.body?.schedule ?? req.body;

        // Accept a single day object or an array of days
        const updates = Array.isArray(raw) ? raw : [raw];

        if (!updates.length || !updates[0]?.day) {
            return sendError(res, 'Debes enviar al menos un día con su configuración', 400);
        }

        const config = await ConfigService.updateSchedule(updates);
        return sendSucces(res, config);
    } catch (error) {
        return sendError(res, 'Error al actualizar los horarios');
    }
};

export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { banner } = req.body;
        if (typeof banner !== 'string') {
            return sendError(res, 'El campo banner debe ser una URL en formato string', 400);
        }

        const config = await ConfigService.updateBanner(banner);
        return sendSucces(res, config);
    } catch (error) {
        return sendError(res, 'Error al actualizar el banner principal');
    }
};