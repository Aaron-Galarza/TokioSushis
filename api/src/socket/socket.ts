import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { UserModel } from '../modules/users/user.model'
import { BranchModel } from '../modules/branches/branch.model'

let io: Server

export const initSocket = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      return next(new Error('Token requerido'))
    }

    try {
      const secret = process.env.JWT_SECRET
      if (!secret) return next(new Error('Configuración de seguridad faltante'))
      const payload = jwt.verify(token, secret)
      if (typeof payload === 'string' || typeof payload.id !== 'string' || !mongoose.isValidObjectId(payload.id)) {
        return next(new Error('Token inválido'))
      }
      const user = await UserModel.findById(payload.id).select('role branchId active').lean()
      if (!user?.active || !['admin', 'encargado'].includes(user.role) || !user.branchId) {
        return next(new Error('Cuenta sin acceso operativo'))
      }
      const branchId = user.branchId.toString()
      if (!await BranchModel.exists({ _id: branchId, active: true })) {
        return next(new Error('Sucursal deshabilitada'))
      }
      socket.data.branchId = branchId
      next()
    } catch {
      next(new Error('Token inválido o expirado'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`branch:${socket.data.branchId}`)
    console.log(`[SOCKET] Operador conectado: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Operador desconectado: ${socket.id}`)
    })
  })

  console.log('[SOCKET] Servidor WebSocket iniciado')
}

// Usado en los controllers para emitir eventos
export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io no fue inicializado')
  return io
}
