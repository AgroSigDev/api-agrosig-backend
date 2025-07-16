# API AGROSIG BACKEND 📊

Un sistema de API REST para la optimización y gestion del uso de recursos agrícolas desarrollado como proyecto Integrador de DAVIDCH.

## 📋 Descripción

API AGROSIG BACKEND es una aplicacion contruida con node.js y express que propociona endpoints para la gestion de usaurios y de la agrícultura siendo una herramienta que permita a los agricultores optimizar el uso de sus recursos. El sistema está diseñado para ser escalable y fácil de mantener, utilizando PostgreSQL como base de datos.

## 🚀 Características

- ✅ API REST con Express.js
- ✅ Base de datos PostgreSQL
- ✅ Gestión de usuarios con autenticación
- ✅ Estructura modular MVC
- ✅ Middleware de CORS configurado
- ✅ Variables de entorno para configuración
- ✅ Manejo de errores centralizado
- 🔄 Sistema de gestion de recursos agrícolas (en desarrollo)
- 🔄 Autenticación JWT (en desarrollo)

## 🛠️ Tecnologías Utilizadas

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT + bcrypt
- **Variables de Entorno**: dotenv
- **CORS**: cors
- **Herramientas de Desarrollo**: nodemon, standard

## 📁 Estructura del Proyecto

```
api-survey-system/
├── config.js                          # Configuración de la aplicación
├── index.js                          # Punto de entrada de la aplicación
├── package.json                      # Dependencias y scripts
├── src/
│   ├── server.js                     # Configuración del servidor Express
│   ├── controllers/                  # Controladores de la aplicación
│   │   └── users/
│   │       └── users.controllers.js  # Controlador de usuarios
│   ├── lib/
│   │   └── db.js                     # Configuración de la base de datos
│   ├── models/                       # Modelos de datos
│   │   ├── index.js                  # Exportaciones de modelos
│   │   └── users/
│   │       └── users.model.js        # Modelo de usuarios
│   └── routes/                       # Definición de rutas
│       └── users/
│           └── users.routes.js       # Rutas de usuarios
├── migrations/                       # Migraciones de base de datos
│   └── survey_system_db              # Migración para crear la tabla de usuarios
├── .env                              # Variables de entorno
├── .gitignore                        # Archivos a ignorar por Git
└── README.md                         # Documentación del proyecto
```

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

## 👥 Autores
- **David Hernández** - [@Dave0097-hdz](https://github.com/Dave0097-hdz)

## 📄 Licencia

ISC License
