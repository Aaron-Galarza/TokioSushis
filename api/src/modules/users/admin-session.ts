import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { UserModel } from './user.model'

export async function validateAdminToken(token: string): Promise<jwt.JwtPayload | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Configuración de seguridad faltante')

  let decoded: jwt.JwtPayload
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'tokyo-sushis-api',
      audience: 'tokyo-sushis-admin',
    }) as jwt.JwtPayload
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return null
    throw error
  }

  if (decoded.role !== 'admin' || typeof decoded.id !== 'string' || !mongoose.isValidObjectId(decoded.id)) {
    return null
  }
  const user = await UserModel.findById(decoded.id).select('_id role email').lean()
  return user?.role === 'admin' && user.email === decoded.email ? decoded : null
}
