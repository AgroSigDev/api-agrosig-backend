# API AGROSIG BACKEND 📊

Un sistema completo de API REST para la optimización y gestión del uso de recursos agrícolas desarrollado como proyecto Integrador.

## 📋 Descripción

API AGROSIG BACKEND es una aplicación construida con Node.js y Express que proporciona endpoints para la gestión de usuarios y de la agricultura, siendo una herramienta que permite a los agricultores optimizar el uso de sus recursos. El sistema está diseñado para ser escalable y fácil de mantener, utilizando PostgreSQL como base de datos.

## 🚀 Características Principales

- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Gestión de usuarios** con roles (admin/user)
- ✅ **Gestión de parcelas** y geolocalización
- ✅ **Seguimiento de cultivos** y actividades
- ✅ **Pronóstico meteorológico** integrado
- ✅ **Lotes de producción** con trazabilidad QR
- ✅ **Sistema de notificaciones** push (FCM)
- ✅ **Chat/comentarios** en tiempo real
- ✅ **Documentación Swagger** completa
- ✅ **API REST** con Express.js
- ✅ **Base de datos PostgreSQL**
- ✅ **Estructura modular MVC**
- ✅ **Middleware de CORS** configurado
- ✅ **Variables de entorno** para configuración
- ✅ **Manejo de errores** centralizado

## 🏗️ Estructura de Módulos

- **Auth** - Autenticación y registro
- **Users** - Gestión de usuarios y perfiles
- **Plots** - Administración de parcelas
- **Weather** - Datos climáticos
- **Crop** - Gestión de cultivos
- **Activity** - Actividades agrícolas
- **Production** - Lotes y trazabilidad
- **Comment** - Sistema de chat
- **FCM** - Notificaciones push
- **Notifications** - Gestión de notificaciones

## 🛠️ Tecnologías Utilizadas

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT + Refresh Tokens + bcrypt
- **Variables de Entorno**: dotenv
- **CORS**: cors
- **Documentación**: Swagger/OpenAPI
- **Notificaciones**: Firebase Cloud Messaging
- **Logs**: Winston
- **Migraciones**: db-migrate
- **Testing**: Jest + Supertest
- **Herramientas de Desarrollo**: nodemon, standard

## ⚡ Instalación y Configuración

### Prerrequisitos

- Node.js (versión 20.10.0 o superior)
- PostgreSQL
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd api-agrosig-backend
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Crear un archivo `.env` en la raíz del proyecto:

   ```bash
   # Configuración de la base de datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=agrosig_db
   DB_USER=your_username
   DB_PASSWORD=your_password

   # Configuración del servidor
   PORT=4000
   NODE_ENV=development

   # Configuración JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

   # Configuración Firebase (opcional)
   FCM_SERVICE_ACCOUNT_KEY=path/to/service-account-key.json
   ```

4. **Inicializar la base de datos**

   ```bash
   npm run db:init
   npm run migrate:up
   ```

## 🚀 Uso

### Iniciar el servidor

**Modo desarrollo:**

```bash
npm run dev
```

**Modo producción:**

```bash
npm start
```

El servidor se ejecutará en `http://localhost:4000` (o el puerto configurado en las variables de entorno).

### Documentación de la API

Una vez iniciado el servidor, puedes acceder a la documentación interactiva de la API en:

- **Local**: `http://localhost:4000/api-docs`

## 🔄 Flujo de Uso Recomendado

1. **Registro/Login** → Obtener tokens de autenticación
2. **Gestión de Parcelas** → Registrar ubicaciones de cultivo
3. **Configuración de Cultivos** → Crear y gestionar cultivos
4. **Registro de Actividades** → Registrar labores agrícolas
5. **Seguimiento de Producción** → Crear lotes y generar QR
6. **Monitoreo** → Consultar clima y notificaciones

## 🧪 Testing

Para ejecutar las pruebas:

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch
```

## 📦 Scripts Disponibles

- `npm start` - Inicia servidor en producción
- `npm run dev` - Inicia servidor en desarrollo con nodemon
- `npm test` - Ejecuta pruebas unitarias
- `npm run test:watch` - Ejecuta pruebas en modo watch
- `npm run migrate:up` - Ejecuta migraciones pendientes
- `npm run migrate:down` - Revierte última migración
- `npm run migrate:create` - Crea nueva migración
- `npm run migrate:reset` - Resetea todas las migraciones
- `npm run lint:fix` - Corrige estilo de código automáticamente

## 🔐 Autenticación

La API utiliza autenticación Bearer Token con refresh tokens. Para acceder a los endpoints protegidos:

```bash
curl -H "Authorization: Bearer <your_jwt_token>" \
     -H "x-refresh-token: <your_refresh_token>" \
     http://localhost:4000/api/endpoint
```

## 📄 Notas Importantes

- La API requiere autenticación para la mayoría de endpoints
- Algunos endpoints requieren roles específicos (admin/user)
- El servidor está configurado para escuchar en `0.0.0.0` para compatibilidad con contenedores
- Las imágenes de perfil se almacenan en `/uploads/profile/`

## 👥 Autor

- **David Hernández** - [@Dave0097-hdz](https://github.com/Dave0097-hdz)

## 📄 Licencia

- ISC License
