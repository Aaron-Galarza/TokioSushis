import { Request, Response } from 'express';
import * as AnalyticsService from './analytics.service';

const VALID_RANGES = ['hoy', 'ayer', 'semana', 'mes'] as const;
type Range = (typeof VALID_RANGES)[number];

export const getAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || 'hoy';

    if (!VALID_RANGES.includes(range as Range)) {
      return res.status(400).json({
        success: false,
        message: "Rango no válido. Usa 'hoy', 'ayer', 'semana' o 'mes'.",
      });
    }

    const data = await AnalyticsService.getAnalytics(range as Range);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[ANALYTICS_ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al calcular las estadísticas',
    });
  }
};