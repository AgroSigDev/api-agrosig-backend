import express from 'express'
import cors from 'cors'
import http from 'http'
import { setupSwagger } from '../swagger.config.js'
import { config } from '../config.js'
import userRouter from './routes/users/users.routes.js'
import authRouter from './routes/auth/auth.routes.js'
import plotRouter from './routes/plots/plots.routes.js'
import weatherPlotRouter from './routes/weather/weather.routes.js'
import cropRouter from './routes/crop/crop.routes.js'
import activityRouter from './routes/activitys/activity.routes.js'
import reportRouter from './routes/report/report.routes.js'
import productionRouter from './routes/production_batch/production_batch.routes.js'
import commentRouter from './routes/chat/chat.route.js'
import fcmRouter from './routes/fcm/fcm.routes.js'
import notificationService from './routes/notifications/notifications.routes.js'
import notificationsSchedulerService from './services/notifications.scheduler.service.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { BadRequestError } from './lib/api.errors.js'
import { errorHandler } from './middlewares/index.js'

const app = express()

// Configuración del servidor HTTPS
const httpServer = http.createServer(app)

// Iniciar el servicio de notificaciones programadas
notificationsSchedulerService.startSchedulers()
console.log('🔔 Servicio de notificaciones programadas iniciado.', notificationsSchedulerService.startSchedulers)

// Middlewares
app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://192.168.34.104:4000',
    'https://api-agrosig-backend.onrender.com',
    'http://localhost',
    'http://10.0.2.2:4000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(express.urlencoded({ extended: true }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuracion de Swagger
setupSwagger(app)

app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')))

// Rutas - Endpoints
app.use('/auth', authRouter)
app.use('/users', userRouter)
app.use('/plots', plotRouter)
app.use('/weather', weatherPlotRouter)
app.use('/crop', cropRouter)
app.use('/activity', activityRouter)
app.use('/report', reportRouter)
app.use('/production', productionRouter)
app.use('/comment', commentRouter)
app.use('/fcm', fcmRouter)
app.use('/notifications', notificationService)

// Ruta Raiz
app.get('/', (request, response) => {
  response.json({
    description: 'Proyecto INTEGRADOR - API AGROSIG BACKEND - DAVIDCH',
    version: '1.0.0',
    author: [
      {
        name: 'David Chavarria',
        userGit: '@davidch'
      }
    ],
    documentation: config.docs.urlDocs,
    api_endpoint: `http://localhost:${config.port}`,
    environment: config.env
  })
})

// Ruta healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.env
  })
})

// Middleware para manejar errores de rutas no encontradas
app.use((request, response, next) => {
  next(new BadRequestError('Route not found: ' + request.originalUrl))
})

// Middleware para manejar errores - Middleware de error principal
app.use(errorHandler)

export { httpServer }
