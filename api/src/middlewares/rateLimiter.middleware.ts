import rateLimit from 'express-rate-limit'

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
