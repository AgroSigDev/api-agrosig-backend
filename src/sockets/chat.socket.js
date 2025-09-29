import { socketAuthMiddleware } from '../middlewares/index.js'
import { makeRateLimiter } from '../helpers/index.js'
import { createComment, updateComment, deleteComment } from '../controllers/index.js'

const allowMessage = makeRateLimiter(10, 10_000)

export function setupChatNameSpace (io) {
  const nameSpace = io.of('/chat')

  nameSpace.use(socketAuthMiddleware)

  nameSpace.on('connection', (socket) => {
    console.log(`chat: connection ${socket.id} user:${socket.user?.user_id}`)

    // Creating comment
    socket.on('comment:create', async (payload, ack) => {
      try {
        if (!allowMessage(socket)) return ack?.({ ok: false, error: 'rate_limited' })

        const { message } = payload || {}
        if (!message || typeof message !== 'string') return ack?.({ ok: false, error: 'invalid_payload' })

        // controller toma userId del socket
        const created = await createComment(socket.user.user_id, message)

        // Emitir el nuevo comentario a todos en /chat
        nameSpace.emit('comment:new', created)

        // ACK al emisor
        return ack?.({ ok: true, comment: created })
      } catch (err) {
        console.error('socket comment:create error', err)
        // Mapear errores conocidos
        if (err.code === 'NOT_FOUND') return ack?.({ ok: false, error: 'not_found' })
        if (err.message === 'unauthenticated') return ack?.({ ok: false, error: 'unauthenticated' })
        return ack?.({ ok: false, error: 'server_error' })
      }
    })

    // Update Comment
    socket.on('comment:update', async (payload, ack) => {
      try {
        const { comment_id: commentId, message } = payload || {}
        if (!commentId || !message) return ack?.({ ok: false, error: 'invalid_payload' })

        const updated = await updateComment(socket.user.user_id, commentId, message)

        nameSpace.emit('comment:updated', updated)
        return ack?.({ ok: true, updated })
      } catch (err) {
        console.error('socket comment:update error', err)
        if (err.code === 'NOT_FOUND') return ack?.({ ok: false, error: 'not_found' })
        if (err.code === 'FORBIDDEN') return ack?.({ ok: false, error: 'forbidden' })
        return ack?.({ ok: false, error: 'server_error' })
      }
    })

    // Delete Comment
    socket.on('comment:delete', async (payload, ack) => {
      try {
        const { comment_id: commentId } = payload || {}
        if (!commentId) return ack?.({ ok: false, error: 'invalid_payload' })

        const deleted = await deleteComment(socket.user.user_id, commentId)
        nameSpace.emit('comment:deleted', deleted)
        return ack?.({ ok: true, deleted })
      } catch (err) {
        console.error('socket comment:delete error', err)
        if (err.code === 'NOT_FOUND') return ack?.({ ok: false, error: 'not_found' })
        if (err.code === 'FORBIDDEN') return ack?.({ ok: false, error: 'forbidden' })
        return ack?.({ ok: false, error: 'server_error' })
      }
    })

    socket.on('disconnect', (reason) => {
      console.log(`chat: disconnect ${socket.id} reason:${reason}`)
    })
  })
}
