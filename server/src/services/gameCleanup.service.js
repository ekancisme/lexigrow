/**
 * Game Session & Memory Cleanup Service
 * Tracks active socket connections, rooms, and timers to prevent memory leaks.
 */

class GameCleanupService {
  constructor() {
    // Map of socketId -> Set of active interval/timeout IDs
    this.activeTimers = new Map()
    // Map of socketId -> Set of active game room IDs
    this.activeRooms = new Map()
    // Map of gameRoomId -> Set of socket IDs
    this.roomMembers = new Map()
  }

  /**
   * Register a timer attached to a socket to ensure it gets cleared on disconnect
   */
  registerTimer(socketId, timerId) {
    if (!this.activeTimers.has(socketId)) {
      this.activeTimers.set(socketId, new Set())
    }
    this.activeTimers.get(socketId).add(timerId)
  }

  /**
   * Unregister a single completed/cleared timer from tracking
   */
  unregisterTimer(socketId, timerId) {
    const timers = this.activeTimers.get(socketId)
    if (timers) {
      timers.delete(timerId)
      if (timers.size === 0) {
        this.activeTimers.delete(socketId)
      }
    }
  }

  /**
   * Clear all timers for a given socket
   */
  clearTimers(socketId) {
    const timers = this.activeTimers.get(socketId)
    if (timers) {
      for (const timerId of timers) {
        clearInterval(timerId)
        clearTimeout(timerId)
      }
      this.activeTimers.delete(socketId)
    }
  }

  /**
   * Join a socket into a game room with tracking
   */
  joinGameRoom(socket, roomId) {
    socket.join(roomId)
    const socketId = socket.id

    if (!this.activeRooms.has(socketId)) {
      this.activeRooms.set(socketId, new Set())
    }
    this.activeRooms.get(socketId).add(roomId)

    if (!this.roomMembers.has(roomId)) {
      this.roomMembers.set(roomId, new Set())
    }
    this.roomMembers.get(roomId).add(socketId)
  }

  /**
   * Leave a game room with tracking
   */
  leaveGameRoom(socket, roomId) {
    socket.leave(roomId)
    const socketId = socket.id

    if (this.activeRooms.has(socketId)) {
      this.activeRooms.get(socketId).delete(roomId)
      if (this.activeRooms.get(socketId).size === 0) {
        this.activeRooms.delete(socketId)
      }
    }

    if (this.roomMembers.has(roomId)) {
      this.roomMembers.get(roomId).delete(socketId)
      if (this.roomMembers.get(roomId).size === 0) {
        this.roomMembers.delete(roomId)
      }
    }
  }

  /**
   * Completely clean up all resources associated with a disconnected socket
   */
  cleanupSocket(socket) {
    const socketId = socket.id
    this.clearTimers(socketId)

    const rooms = this.activeRooms.get(socketId)
    if (rooms) {
      for (const roomId of rooms) {
        if (this.roomMembers.has(roomId)) {
          this.roomMembers.get(roomId).delete(socketId)
          if (this.roomMembers.get(roomId).size === 0) {
            this.roomMembers.delete(roomId)
          }
        }
        socket.leave(roomId)
      }
      this.activeRooms.delete(socketId)
    }

    // Remove all event listeners attached to this socket
    socket.removeAllListeners()
  }

  getStats() {
    return {
      activeSocketsWithTimers: this.activeTimers.size,
      activeRooms: this.roomMembers.size,
    }
  }
}

export const gameCleanupService = new GameCleanupService()
export default gameCleanupService
