import { io } from 'socket.io-client'

let socket = null

/**
 * Connect to the Socket.io server
 * @param {string} token - JWT Auth token
 * @returns {Object} The socket client instance
 */
export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect()
  }

  // Uses default origin as we proxied /socket.io in Vite
  socket = io({
    auth: {
      token: token || localStorage.getItem('lexigrow_token')
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('🔌 Connected to Socket.io server')
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected from Socket.io server:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket.io connection error:', error.message)
  })

  return socket
}

/**
 * Retrieve the active socket client instance
 * @returns {Object|null}
 */
export const getSocket = () => {
  return socket
}

/**
 * Disconnect the socket client
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('🔌 Socket disconnected manually')
  }
}
