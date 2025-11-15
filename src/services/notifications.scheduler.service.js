import { pool } from '../lib/db.js'
import cron from 'node-cron'
import FirebaseService from './firebase.service.js'

class NotificationScheduler {
  /**
   * Inicia las tareas programadas del sistema.
   */
  startSchedulers () {
    // Clima: todos los días a las 7:00 AM
    cron.schedule('0 7 * * *', async () => {
      console.log(`[${new Date().toISOString()}] 🔔 Ejecutando notificaciones del clima`)
      await this.safeExecute(this.sendWeatherNotifications.bind(this))
    })

    // Actividades: todos los días a las 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      console.log(`[${new Date().toISOString()}] 📅 Ejecutando recordatorios de actividades`)
      await this.safeExecute(this.sendActivityReminders.bind(this))
    })
    // cron.schedule('* * * * *', this.sendWeatherNotifications.bind(this)) // Cada minuto
    // cron.schedule('* * * * *', this.sendActivityReminders.bind(this))
  }

  /**
   * Ejecuta una tarea segura, manejando errores de forma controlada.
   */
  async safeExecute (taskFn) {
    try {
      await taskFn()
    } catch (err) {
      console.error('Error en tarea programada:', err)
    }
  }

  /**
   * Envía notificaciones diarias del clima a usuarios con parcelas configuradas.
   */
  async sendWeatherNotifications () {
    try {
      const query = `
        SELECT DISTINCT 
        u.user_id, 
        u.email, 
        pc.city_name, 
        pc.temperature, 
        pc.humidity, 
        pc.description, 
        pc.min_temp, 
        pc.max_temp,
        COUNT(uf.fcm_token) as token_count
      FROM users u
      JOIN plots p ON u.user_id = p.user_id
      JOIN plot_climate pc ON p.plot_id = pc.plot_id
      LEFT JOIN user_fcm_tokens uf ON u.user_id = uf.user_id
      WHERE u.is_active = true 
        AND pc.date = CURRENT_DATE
        AND u.configured_plot = true
      GROUP BY u.user_id, u.email, pc.city_name, pc.temperature, pc.humidity, 
               pc.description, pc.min_temp, pc.max_temp
      HAVING COUNT(uf.fcm_token) > 0
      `

      const { rows } = await pool.query(query)
      console.log(`🌤️ Usuarios a notificar por clima: ${rows.length}`)

      let successCount = 0
      let errorCount = 0

      for (const row of rows) {
        try {
          const title = `🌤️ Clima en ${row.city_name || 'tu parcela'}`
          const body = `Hoy: ${row.description || 'Sin descripción'}. Temp: ${row.temperature}°C (Max: ${row.max_temp}°C, Min: ${row.min_temp}°C). Humedad: ${row.humidity}%`

          await FirebaseService.sendToUser(row.user_id, title, body, {
            type: 'weather',
            city: String(row.city_name || ''),
            temperature: String(row.temperature || ''),
            humidity: String(row.humidity || ''),
            min_temp: String(row.min_temp || ''),
            max_temp: String(row.max_temp || ''),
            timestamp: new Date().toISOString()
          })

          await this.logNotification(row.user_id, 'weather', title, body)
          successCount++
        } catch (error) {
          console.error(`Error notificando usuario ${row.user_id}:`, error)
          errorCount++
        }
        console.log(`Notificaciones de clima: ${successCount} exitosas, ${errorCount} errores`)
      }
    } catch (error) {
      console.error('Error en notificaciones de clima:', error)
    }
  }

  /**
   * Envía recordatorios de actividades programadas del día.
   */
  async sendActivityReminders () {
    try {
      const query = `
        SELECT a.activity_id, a.user_id, a.activity_type, a.description,
               u.first_name, c.crop_type, c.crop_id
        FROM activity a
        JOIN users u ON a.user_id = u.user_id
        JOIN crop c ON a.crop_id = c.crop_id
        WHERE a.date = CURRENT_DATE 
          AND u.is_active = true
      `

      const { rows } = await pool.query(query)
      console.log(`Actividades encontradas para hoy: ${rows.length}`)

      for (const row of rows) {
        if (!row.user_id) continue

        const title = '📅 Recordatorio de Actividad'
        const body = `Hoy tienes programado: ${row.activity_type} para ${row.crop_type}. ${row.description || ''}`

        await FirebaseService.sendToUser(row.user_id, title, body, {
          type: 'activity_reminder',
          activity_id: String(row.activity_id || ''),
          activity_type: String(row.activity_type || ''),
          crop_type: String(row.crop_type || ''),
          crop_id: String(row.crop_id || ''),
          timestamp: new Date().toISOString()
        })

        await this.logNotification(row.user_id, 'activity_reminder', title, body)
      }
    } catch (error) {
      console.error('Error en recordatorios de actividades:', error)
    }
  }

  /**
   * Registra el envío de una notificación en la base de datos.
   */
  async logNotification (userId, type, title, message) {
    try {
      const query = {
        text: `
          INSERT INTO notifications 
          (user_id, type_notification, title_notification, message_notification, status_notification, created_at)
          VALUES ($1, $2, $3, $4, 'sent', NOW())
        `,
        values: [userId, type, title, message]
      }
      await pool.query(query)
      console.log(`Notificación registrada para usuario ${userId}`)
    } catch (err) {
      console.error('Error registrando notificación:', err)
    }
  }
}

export default new NotificationScheduler()
