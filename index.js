import { config } from './config.js'
import { httpServer } from './src/server.js'

async function startServer () {
  await new Promise((resolve) => httpServer.listen(config.port, '0.0.0.0', resolve))

  console.log(`🚀 Servidor iniciado en puerto: ${config.port}`)
  console.log(`🌐 Entorno: ${config.env}`)

  if (config.env === 'production') {
    console.log('🔐 URL de producción: https://api-agrosig-backend.onrender.com')
    console.log('📚 Docs: https://api-agrosig-backend.onrender.com/api-docs')
  } else {
    console.log(`🔐 URL local: http://localhost:${config.port}`)
    console.log(`📚 Docs: http://localhost:${config.port}/api-docs`)
  }
}

startServer()
  .catch(error => console.error('Error al iniciar el servidor:', error))
