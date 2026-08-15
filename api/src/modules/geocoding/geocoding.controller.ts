import { Request, Response } from 'express';
import { googleGeocode } from './geocoding.service';
import { sendSucces } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export const google = asyncHandler(async (req: Request, res: Response) => {
  const query = ((req.query.query as string) || '').trim();

  if (query.length < 4) {
    return sendSucces(res, []);
  }

  const results = await googleGeocode(query);
  return sendSucces(res, results);
});
