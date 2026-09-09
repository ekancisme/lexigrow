import api from './api.js'

export const chatService = {
  // Get chat history for a room
  getHistory(room, limit = 50, before = null) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (before) params.append('before', before)
    return api.get(`/chat/history/${room}?${params.toString()}`)
  },

  // Send a message via REST (fallback)
  sendMessage(content, recipientId = null, room = null) {
    return api.post('/chat/message', { content, recipientId, room })
  },

  // Admin: get all chat rooms with unread counts
  getRooms() {
    return api.get('/chat/rooms')
  },

  // Admin: mark all messages in a room as read
  markRoomRead(room) {
    return api.post(`/chat/rooms/${room}/read`)
  },
}

export default chatService