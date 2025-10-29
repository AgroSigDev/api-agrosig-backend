import { config } from './config.js'
import { httpsServer } from './src/server.js'

async function startServer () {
  // Conectar nuestra base de datos (si tienes conexión a BD)

  // Iniciar el servidor HTTPS en todas las interfaces
  await new Promise((resolve) => httpsServer.listen(config.port, resolve))

  console.log(`🔐  Servidor HTTPS: https://localhost:${config.port}`)
  console.log(`📚 Documentación de la API disponible en: ${config.docs.urlDocs}`)
  console.log('🌐 Frontend recomendado: https://localhost:3000')
}

startServer()
  .catch(error => console.error('Error al iniciar el servidor:', error))
