import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as UserService from './user.services'
import { sendError, sendSucces } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

const DUMMY_PASSWORD_HASH = '$2b$10$ZARiq0STj3VaV99gTC7a3.XYPSCTX.pYXZLD3HejmC08WWKkXsPte'

export const login = asyncHandler(async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store')
  const { email, password } = req.body

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 1024) {
    return sendError(res, 'Email y contraseña son obligatorios', 400)
  }

  const user = await UserService.findByEmail(email.trim())
  if (!user) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
    return sendError(res, 'Credenciales inválidas', 401)
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    return sendError(res, 'Credenciales inválidas', 401)
  }

  if (!process.env.JWT_SECRET) {
    return sendError(res, 'Configuración de seguridad faltante', 500)
  }

  // user._id es el ObjectId de Mongo; .toString() lo convierte a string para el token
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '4h', issuer: 'tokyo-sushis-api', audience: 'tokyo-sushis-admin' }
  )

  return res.json({ success: true, data: { message: 'Bienvenido, Admin', token } })
})

export const session = asyncHandler(async (req: Request, res: Response) => {
  return res.json({ success: true, data: { authenticated: true } })
})
