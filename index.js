import { config } from './config.js'
import { httpServer } from './src/server.js'

async function startServer () {
  // Iniciar el servidor HTTP en todas las interfaces
  await new Promise((resolve) => httpServer.listen(config.port, resolve))

  console.log(`🔐 Servidor HTTP: https://api-agrosig-backend.onrender.com:${config.port}`)
  console.log(`📚 Documentación de la API disponible en: ${config.docs.urlDocs}`)
  console.log('🌐 Sitio Web: http://localhost:3000')
}

startServer()
  .catch(error => console.error('Error al iniciar el servidor:', error))
