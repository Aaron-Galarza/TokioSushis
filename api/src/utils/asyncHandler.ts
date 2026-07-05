import { Request, Response, NextFunction } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/** Envuelve un handler async y reenvía cualquier error a error.middleware.ts vía next(), sin try/catch repetido. */
export const asyncHandler = (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
