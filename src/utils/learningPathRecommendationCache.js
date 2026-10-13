const CACHE_PREFIX = 'lexigrow:dashboard-learning-path:v1:'

export const getLearningPathRecommendationCacheKey = (userId) => (
  userId ? `${CACHE_PREFIX}${encodeURIComponent(String(userId))}` : ''
)

export function readLearningPathRecommendationCache(key) {
  if (!key) return null
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null')
    if (!cached?.response || !Number.isFinite(cached.expiresAt) || cached.expiresAt <= Date.now()) {
      localStorage.removeItem(key)
      return null
    }
    return cached.response
  } catch {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage may be disabled by the browser.
    }
    return null
  }
}

export function writeLearningPathRecommendationCache(key, response, ttlMs) {
  if (!key || !response?.data) return
  try {
    localStorage.setItem(key, JSON.stringify({
      response,
      expiresAt: Date.now() + ttlMs,
    }))
  } catch {
    // Storage can be unavailable or full; the dashboard request still succeeds.
  }
}

export function invalidateLearningPathRecommendationCache(userId) {
  const key = getLearningPathRecommendationCacheKey(userId)
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage may be disabled by the browser.
  }
}
