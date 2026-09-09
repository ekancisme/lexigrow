import { describe, it, expect, vi, beforeEach } from 'vitest'
import cacheService from '../src/services/cache.service.js'
import gameCleanupService from '../src/services/gameCleanup.service.js'
import { gamePlayRateLimiter, gameSubmitRateLimiter, gameAIRecommendationLimiter } from '../src/middleware/gameRateLimit.middleware.js'
import { runNLPAnalysis } from '../src/services/ai.service.js'

describe('VPS Optimization & Performance Protections', () => {
  beforeEach(() => {
    cacheService.clear()
  })

  describe('1. Dual-Layer Cache Service (Redis / In-Memory LRU)', () => {
    it('stores and retrieves cached data with deterministic key hashing', async () => {
      const key = cacheService.hashKey('test:vocab', { word: 'serendipity', level: 'C1' })
      expect(key).toMatch(/^test:vocab:[a-f0-9]{16}$/)

      await cacheService.set(key, { meaning: 'tình cờ may mắn' }, 100)
      const cached = await cacheService.get(key)
      expect(cached).toEqual({ meaning: 'tình cờ may mắn' })
    })

    it('wraps async function and avoids duplicate execution on cache hit', async () => {
      const key = 'test:wrap:expensive_calc'
      const mockFetch = vi.fn().mockResolvedValue({ score: 9.5 })

      const result1 = await cacheService.wrap(key, mockFetch, 60)
      const result2 = await cacheService.wrap(key, mockFetch, 60)

      expect(result1).toEqual({ score: 9.5 })
      expect(result2).toEqual({ score: 9.5 })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('deletes keys and handles non-existent keys cleanly', async () => {
      await cacheService.set('temp_key', 'some_value', 60)
      expect(await cacheService.get('temp_key')).toBe('some_value')

      await cacheService.del('temp_key')
      expect(await cacheService.get('temp_key')).toBeNull()
    })
  })

  describe('2. Game Rate Limiters', () => {
    it('defines standard rate limiters for play, submit, and AI recommendation', () => {
      expect(typeof gamePlayRateLimiter).toBe('function')
      expect(typeof gameSubmitRateLimiter).toBe('function')
      expect(typeof gameAIRecommendationLimiter).toBe('function')
    })
  })

  describe('3. Socket & Memory Cleanup Service', () => {
    it('tracks active rooms, clears timers and cleans up socket on disconnect', () => {
      const mockSocket = {
        id: 'socket_123',
        join: vi.fn(),
        leave: vi.fn(),
        removeAllListeners: vi.fn(),
      }

      // Join game room
      gameCleanupService.joinGameRoom(mockSocket, 'room_game_alpha')
      expect(mockSocket.join).toHaveBeenCalledWith('room_game_alpha')

      // Register interval timer
      const mockTimer = setInterval(() => {}, 1000)
      gameCleanupService.registerTimer('socket_123', mockTimer)

      const statsBefore = gameCleanupService.getStats()
      expect(statsBefore.activeSocketsWithTimers).toBe(1)
      expect(statsBefore.activeRooms).toBe(1)

      // Cleanup on disconnect
      gameCleanupService.cleanupSocket(mockSocket)
      expect(mockSocket.leave).toHaveBeenCalledWith('room_game_alpha')
      expect(mockSocket.removeAllListeners).toHaveBeenCalled()

      const statsAfter = gameCleanupService.getStats()
      expect(statsAfter.activeSocketsWithTimers).toBe(0)
      expect(statsAfter.activeRooms).toBe(0)
    })
  })

  describe('4. NLP Guard Against Accidental Mini-Game Calls', () => {
    it('resolves null immediately for empty or short strings without spawning Python', async () => {
      const emptyResult = await runNLPAnalysis('')
      expect(emptyResult).toBeNull()

      const shortWordResult = await runNLPAnalysis('apple')
      expect(shortWordResult).toBeNull()

      const nullResult = await runNLPAnalysis(null)
      expect(nullResult).toBeNull()
    })
  })
})
