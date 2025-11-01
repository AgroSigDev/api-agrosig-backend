import express from 'express'
import cors from 'cors'
import https from 'https'
import fs from 'fs'
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

const app = express()

// Leer certificados SSL
const sslOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}

// Configuración del servidor HTTPS
const httpsServer = https.createServer(sslOptions, app)

// Iniciar el servicio de notificaciones programadas
notificationsSchedulerService.startSchedulers()
console.log('🔔 Servicio de notificaciones programadas iniciado.', notificationsSchedulerService.startSchedulers)

// Middlewares
app.use(express.json())
app.use(cors({
  origin: [
    'https://localhost:3000',
    'http://localhost:3000',
    'https://192.168.34.101:4000',
    'http://192.168.34.101:4000'
  ],
  credentials: true
}))
app.use(express.urlencoded({ extended: true }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuracion de Swagger
setupSwagger(app)

app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')))

// Rutas - Endpoints
app.use('/users', userRouter)
app.use('/auth', authRouter)
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
    api_endpoint: `https://localhost:${config.port}`,
    environment: config.env
  })
})

export { httpsServer }
