import request from 'supertest'
import { httpServer } from '../../server.js'
import { pool } from '../../lib/db.js'

describe('🔐 AUTH Endpoints', () => {
  // Antes de las pruebas, limpiar usuarios de prueba
  beforeAll(async () => {
    // Limpiar cualquier usuario de prueba previo
    await pool.query("DELETE FROM users WHERE email LIKE '%test%' OR email = 'david@example.com'")
  })

  afterAll(async () => {
    // Limpiar después de todas las pruebas
    await pool.query("DELETE FROM users WHERE email LIKE '%test%' OR email = 'david@example.com'")
    await pool.end()
  })

  describe('🧩 POST /auth/register', () => {
    it('✅ Debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        first_name: 'David',
        paternal_surname: 'Hernandez',
        maternal_surname: 'Chavarria',
        email: 'david.test@example.com',
        password: 'password123'
      }

      const res = await request(httpServer)
        .post('/auth/register')
        .send(userData)

      console.log('Register Response:', res.body)

      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe('david.test@example.com')
      expect(res.body.token).toBeDefined()
    })

    it('🚫 No debe permitir registrar un correo existente', async () => {
      const userData = {
        first_name: 'David',
        paternal_surname: 'Hernandez',
        maternal_surname: 'Chavarria',
        email: 'david.test@example.com',
        password: 'password123'
      }

      const res = await request(httpServer)
        .post('/auth/register')
        .send(userData)

      expect([400, 500]).toContain(res.statusCode)
      expect(res.body.success).toBe(false)
    })
  })

  describe('🔑 POST /auth/login', () => {
    it('✅ Debe iniciar sesión correctamente con credenciales válidas', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'david.test@example.com',
          password: 'password123'
        })

      console.log('Login Response:', res.body)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
      expect(res.body.data.user.email).toBe('david.test@example.com')
    })

    it('🚫 No debe iniciar sesión con contraseña incorrecta', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'david.test@example.com',
          password: 'wrongpassword'
        })

      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    })

    it('🚫 No debe iniciar sesión con usuario no registrado', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'password123'
        })

      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    })
  })
})
