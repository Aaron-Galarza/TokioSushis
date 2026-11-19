import rateLimit from 'express-rate-limit'
import { createHash } from 'crypto'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  skip: req => typeof req.body?.email !== 'string' || !req.body.email.trim(),
  keyGenerator: req => createHash('sha256').update(req.body.email.trim().toLowerCase()).digest('hex'),
  message: { success: false, error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const ordersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Demasiados pedidos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Demasiados intentos de validación. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const geocodingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Demasiadas búsquedas. Intentá de nuevo en un momento.' },
  standardHeaders: true,
  legacyHeaders: false
})
