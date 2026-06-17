import dotenv from 'dotenv'
import { createServer } from 'http'
import app from './app'
import { connectDB } from './config/db'
import { initSocket } from './socket/socket'

dotenv.config()

const PORT = process.env.PORT || 4000

const httpServer = createServer(app)

initSocket(httpServer)

connectDB()

httpServer.listen(PORT, () => {
  console.log(`server corriendo en http://localhost:${PORT}`)
})
