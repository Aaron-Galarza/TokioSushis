import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { AppError } from '../utils/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Error controlado lanzado desde services o controllers
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode)
  }

  // Mongoose: ObjectId inválido en params
  if (err.name === 'CastError') {
    return sendError(res, 'ID inválido', 400)
  }

  // Mongoose: campo único duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'campo'
    return sendError(res, `Ya existe un registro con ese ${field}`, 409)
  }

  // Mongoose: errores de validación del schema
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e: any) => e.message).join(', ')
    return sendError(res, message, 400)
  }

  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError'
  ) {
    console.error(`[DB_ERROR] ${req.method} ${req.url} - ${err.message}`)
    return sendError(res, 'Servicio temporalmente no disponible', 503)
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Token inválido', 401)
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expirado', 401)
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'JSON inválido en el body de la petición', 400)
  }

  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`)
  return sendError(res, 'Error interno del servidor', 500)
}
