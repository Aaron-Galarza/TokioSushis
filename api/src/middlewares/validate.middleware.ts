import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { sendError } from '../utils/response'

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Datos inválidos'
    return sendError(res, message, 400)
  }
  req.body = result.data
  next()
}
