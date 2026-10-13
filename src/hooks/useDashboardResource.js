import { useEffect, useState } from 'react'
import api from '../services/api.js'
import {
  readLearningPathRecommendationCache,
  writeLearningPathRecommendationCache,
} from '../utils/learningPathRecommendationCache.js'

// Each resource owns its deadline, retry and cleanup; one slow request cannot
// prevent another section from rendering or overwrite a later retry.
export default function useDashboardResource(endpoint, timeoutMs = 5000, cacheOptions = {}) {
  const [attempt, setAttempt] = useState(0)
  const cacheKey = cacheOptions.key || ''
  const cacheTtlMs = cacheOptions.ttlMs || 30 * 60 * 1000
  const [state, setState] = useState(() => {
    const response = readLearningPathRecommendationCache(cacheKey)
    return response
      ? { response, error: null, loading: false }
      : { response: null, error: null, loading: true }
  })

  useEffect(() => {
    if (attempt === 0) {
      const cached = readLearningPathRecommendationCache(cacheKey)
      if (cached) return undefined
    }

    const controller = new AbortController()
    api.get(endpoint, { timeoutMs, signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setState({ response, error: null, loading: false })
          const ttl = response?._meta?.isFallback
            ? Math.min(cacheTtlMs, 5 * 60 * 1000)
            : cacheTtlMs
          writeLearningPathRecommendationCache(cacheKey, response, ttl)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ response: null, error, loading: false })
      })
    return () => controller.abort()
  }, [endpoint, timeoutMs, attempt, cacheKey, cacheTtlMs])

  const retry = () => {
    setState({ response: null, error: null, loading: true })
    setAttempt((value) => value + 1)
  }
  return { ...state, retry }
}
