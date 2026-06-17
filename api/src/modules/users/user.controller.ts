import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as UserService from './user.services'
import { sendError, sendSucces } from '../../utils/response'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return sendError(res, 'Email y contraseña son obligatorios', 400)
    }

    const user = await UserService.findByEmail(email)
    if (!user) {
      return sendError(res, 'Credenciales inválidas', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return sendError(res, 'Credenciales inválidas', 401)
    }

    // user._id es el ObjectId de Mongo; .toString() lo convierte a string para el token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: 'admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '4h' }
    )

    return res.json({ success: true, data: { message: 'Bienvenido, Admin', token } })
  } catch (error) {
    return sendError(res, 'Error al intentar iniciar sesión', 500)
  }
}
