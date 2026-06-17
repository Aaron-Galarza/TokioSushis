import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'

let io: Server

export const initSocket = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  })

  // Middleware de autenticación: solo admins con JWT válido pueden conectarse
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      return next(new Error('Token requerido'))
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!)
      next()
    } catch {
      next(new Error('Token inválido o expirado'))
    }
  })

  io.on('connection', (socket) => {
    socket.join('admins')
    console.log(`[SOCKET] Admin conectado: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Admin desconectado: ${socket.id}`)
    })
  })

  console.log('[SOCKET] Servidor WebSocket iniciado')
}

// Usado en los controllers para emitir eventos
export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io no fue inicializado')
  return io
}
