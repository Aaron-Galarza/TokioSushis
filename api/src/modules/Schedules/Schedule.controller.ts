import { Request, Response } from 'express';
import * as ConfigService from './Schedule.service';
import { ConfigModel } from './Schedule.module';
import { sendSucces, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = await ConfigService.checkStoreStatus();
    return sendSucces(res, status);
});

export const getAdminConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = await ConfigModel.getOrCreateConfig();
    return sendSucces(res, config);
});

export const closeStore = asyncHandler(async (req: Request, res: Response) => {
    const status = await ConfigService.closeStore();
    return sendSucces(res, status);
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
    const raw = req.body?.dailySchedule ?? req.body?.schedule ?? req.body;

    // Accept a single day object or an array of days
    const updates = Array.isArray(raw) ? raw : [raw];

    if (!updates.length || !updates[0]?.day) {
        return sendError(res, 'Debes enviar al menos un día con su configuración', 400);
    }

    const config = await ConfigService.updateSchedule(updates);
    return sendSucces(res, config);
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const { banner } = req.body;
    if (typeof banner !== 'string') {
        return sendError(res, 'El campo banner debe ser una URL en formato string', 400);
    }

    const config = await ConfigService.updateBanner(banner);
    return sendSucces(res, config);
});
