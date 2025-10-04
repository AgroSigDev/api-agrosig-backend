import { socketAuthMiddleware } from '../middlewares/index.js'
import { makeRateLimiter } from '../helpers/index.js'
import { createComment, updateComment, deleteComment, getAllComments } from '../controllers/index.js'
import { Comment } from '../models/index.js'
import { NotificationService } from '../services/notifications.services.js'

const allowMessage = makeRateLimiter(10, 10_000)

export function setupChatNameSpace (io) {
  const nameSpace = io.of('/chat')

  nameSpace.use(socketAuthMiddleware)

  nameSpace.on('connection', (socket) => {
    console.log(`chat: connection ${socket.id} user:${socket.user?.user_id}`)

    // Unir al usuario a su room personal para notificaciones
    socket.join(`user_${socket.user.user_id}`)

    socket.on('comments:get_all', async (ack) => {
      try {
        const comments = await getAllComments()
        return ack?.({ ok: true, comments })
      } catch (err) {
        console.error('socket comments:get_all error', err)
        return ack?.({ ok: false, error: 'server_error' })
      }
    })

    socket.on('comments:get_replies', async (payload, ack) => {
      try {
        const { commentId } = payload
        if (!commentId) return ack?.({ ok: false, error: 'commentId_required' })

        const replies = await Comment.getReplies(commentId)
        return ack?.({ ok: true, replies })
      } catch (err) {
        console.error('socket comments:get_replies error', err)
        return ack?.({ ok: false, error: 'server_error' })
      }
    })

    // Creating comment
    socket.on('comment:create', async (payload, ack) => {
      try {
        if (!allowMessage(socket)) {
          return ack?.({ ok: false, error: 'rate_limited' })
        }

        const { message, parentCommentId } = payload || {}

        // Validation
        if (!message?.trim()) {
          return ack?.({ ok: false, error: 'invalid_message' })
        }

        const created = await createComment(socket.user.user_id, message.trim(), parentCommentId)
        const commentWithUser = await Comment.getCommentById(created.comment_id)

        // Emit to all chat users
        nameSpace.emit('comment:new', commentWithUser)

        // Handle notifications based on comment type
        if (parentCommentId) {
          await NotificationService.notifyCommentReply(commentWithUser, io)
        } else {
          await NotificationService.notifyNewComment(commentWithUser, io)
        }

        return ack?.({ ok: true, comment: commentWithUser })
      } catch (err) {
        console.error('Socket comment:create error:', err)

        const errorMap = {
          PARENT_COMMENT_NOT_FOUND: 'parent_not_found',
          PARENT_COMMENT_DELETED: 'parent_deleted',
          COMMENT_NOT_FOUND: 'comment_not_found'
        }

        return ack?.({
          ok: false,
          error: errorMap[err.message] || 'server_error'
        })
      }
    })

    // Update Comment
    socket.on('comment:update', async (payload, ack) => {
      try {
        const { comment_id: commentId, message } = payload || {}
        if (!commentId || !message) return ack?.({ ok: false, error: 'invalid_payload' })

        const updated = await updateComment(socket.user.user_id, commentId, message)

        nameSpace.emit('comment:updated', updated)

        // Notificar sobre la actualización
        await NotificationService.notifyCommentUpdate(updated, io)

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
