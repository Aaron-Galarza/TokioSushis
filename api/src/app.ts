import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mainRouter from './routes/index'
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://un-toque-ahumado.vercel.app',
    'http://localhost:3000',
    'https://un-toque-ahumado-c1gwleu4y-aaron-galarzas-projects.vercel.app'
].filter(Boolean)

app.use(helmet())
app.use(cors({
    origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json())
app.use(requestLogger)

app.use('/api', mainRouter)

app.get('/', (req, res) => {
    res.send('Api funcionando gg wp')
})

// El error handler va siempre al final, después de todas las rutas
app.use(errorHandler)

export default app;
