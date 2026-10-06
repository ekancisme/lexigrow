import crypto from 'crypto'

/**
 * High-performance Cache Service with Dual-Layer Architecture:
 * 1. Redis (if REDIS_URL is configured and reachable)
 * 2. In-Memory LRU Cache with TTL (zero-dependency fallback, bounded memory)
 */

class InMemoryCache {
  constructor(maxSize = 2000, defaultTtlSeconds = 3600) {
    this.maxSize = maxSize
    this.defaultTtl = defaultTtlSeconds * 1000
    this.store = new Map()
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    // Refresh LRU order (delete and re-insert)
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  set(key, value, ttlSeconds) {
    const ttl = (ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl)
    const expiresAt = ttl > 0 ? Date.now() + ttl : null

    // Evict oldest item if max size reached
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      if (firstKey) this.store.delete(firstKey)
    }

    this.store.set(key, { value, expiresAt })
    return true
  }

  del(key) {
    return this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  size() {
    return this.store.size
  }
}

class CacheService {
  constructor() {
    this.memoryCache = new InMemoryCache(2000, 3600)
    this.redisClient = null
    this.isRedisReady = false
    this.initRedis()
  }

  async initRedis() {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      return
    }

    try {
      const { createClient } = await import('redis').catch(() => ({}))
      if (!createClient) return

      const client = createClient({ url: redisUrl })
      client.on('error', (err) => {
        console.warn('[CacheService] Redis error (using in-memory fallback):', err.message)
        this.isRedisReady = false
      })
      client.on('ready', () => {
        console.log('⚡ [CacheService] Connected to Redis Cache successfully')
        this.isRedisReady = true
      })
      await client.connect()
      this.redisClient = client
    } catch (err) {
      console.warn('[CacheService] Could not initialize Redis (using in-memory cache):', err.message)
      this.isRedisReady = false
    }
  }

  /**
   * Generates a deterministic cache key
   */
  hashKey(prefix, data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    const hash = crypto.createHash('sha256').update(str).digest('hex').slice(0, 16)
    return `${prefix}:${hash}`
  }

  /**
   * Get value from cache (Redis -> Memory)
   */
  async get(key) {
    if (this.isRedisReady && this.redisClient) {
      try {
        const data = await this.redisClient.get(key)
        if (data) return JSON.parse(data)
      } catch (err) {
        console.warn(`[CacheService] Redis get failed for ${key}:`, err.message)
      }
    }
    return this.memoryCache.get(key)
  }

  /**
   * Set value into cache (Redis + Memory)
   */
  async set(key, value, ttlSeconds = 3600) {
    this.memoryCache.set(key, value, ttlSeconds)

    if (this.isRedisReady && this.redisClient) {
      try {
        const payload = JSON.stringify(value)
        if (ttlSeconds > 0) {
          await this.redisClient.setEx(key, ttlSeconds, payload)
        } else {
          await this.redisClient.set(key, payload)
        }
      } catch (err) {
        console.warn(`[CacheService] Redis set failed for ${key}:`, err.message)
      }
    }
    return true
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    this.memoryCache.del(key)
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.del(key)
      } catch (err) {
        console.warn(`[CacheService] Redis del failed for ${key}:`, err.message)
      }
    }
    return true
  }

  /**
   * Wrap an async computation with cache
   */
  async wrap(key, fetchFn, ttlSeconds = 3600) {
    const cached = await this.get(key)
    if (cached !== null && cached !== undefined) {
      return cached
    }

    const result = await fetchFn()
    if (result !== null && result !== undefined) {
      await this.set(key, result, ttlSeconds)
    }
    return result
  }

  // A renewable Redis lease coordinates AI work across server processes.
  // Without Redis the caller's in-flight map still deduplicates locally.
  async acquireLease(key, ttlMs = 30000) {
    if (!this.isRedisReady || !this.redisClient) return async () => {}
    const client = this.redisClient
    const token = crypto.randomUUID()
    const lockKey = `lock:${key}`
    try {
      if (!await client.set(lockKey, token, { NX: true, PX: ttlMs })) return null
    } catch (error) {
      console.warn('[CacheService] Lease unavailable, using local deduplication:', error.message)
      return async () => {}
    }
    const renew = setInterval(() => {
      client.eval(
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end',
        { keys: [lockKey], arguments: [token, String(ttlMs)] },
      ).catch((error) => console.warn('[CacheService] Lease renewal failed:', error.message))
    }, Math.floor(ttlMs / 3))
    renew.unref?.()
    return async () => {
      clearInterval(renew)
      try {
        await client.eval(
          'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
          { keys: [lockKey], arguments: [token] },
        )
      } catch (error) {
        console.warn('[CacheService] Lease release failed:', error.message)
      }
    }
  }

  clear() {
    this.memoryCache.clear()
  }
}

export const cacheService = new CacheService()
export default cacheService
