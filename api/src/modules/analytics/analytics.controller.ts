import { Request, Response } from 'express';
import * as AnalyticsService from './analytics.service';
import { VALID_RANGES, Range } from '../../utils/dateRange';
import { asyncHandler } from '../../utils/asyncHandler';

export const getAnalyticsReport = asyncHandler(async (req: Request, res: Response) => {
  const range = (req.query.range as string) || 'hoy';

  if (!VALID_RANGES.includes(range as Range)) {
    return res.status(400).json({
      success: false,
      message: "Rango no válido. Usa 'hoy', 'ayer', 'semana' o 'mes'.",
    });
  }

  const data = await AnalyticsService.getAnalytics(range as Range);

  return res.status(200).json({ success: true, data });
});