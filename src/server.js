import express from 'express'
import cors from 'cors'
import https from 'https'  // <- NUEVO
import http from 'http'
import fs from 'fs'        // <- NUEVO
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
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

// Leer certificados SSL <- NUEVO
const sslOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}

// Configuración del servidor HTTPS <- MODIFICADO
const httpsServer = https.createServer(sslOptions, app)

// Servidor HTTP para redirección (opcional) <- NUEVO
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, {
    "Location": "https://" + req.headers['host'] + req.url
  })
  res.end()
})

// Middlewares
app.use(express.json())
app.use(cors({
  origin: ['https://localhost:3000', 'http://localhost:3000'], // <- MEJORADO
  credentials: true
}))
app.use(express.urlencoded({ extended: true }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuracion de Swagger
setupSwagger(app)

app.use('/images', express.static(path.join(__dirname, 'src/uploads/profile')))

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
    documentation: `${config.docs.baseUrl || 'https://localhost:4000'}/api-docs` // <- Cambiado a HTTPS
  })
})

// Iniciar servidores <- NUEVO
const HTTPS_PORT = 4000
const HTTP_PORT = 4001

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`🚀 Backend con SSL en https://localhost:${HTTPS_PORT}`)
})

httpServer.listen(HTTP_PORT, () => {
  console.log(`🔁 Redirección HTTP → HTTPS en http://localhost:${HTTP_PORT}`)
})

export { httpsServer, httpServer }