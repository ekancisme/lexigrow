import { useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

/**
 * Hook để lấy và quản lý lộ trình học được AI đề xuất
 */
export default function useLearningPath() {
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRecommendation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/sessions/recommendation')
      setRecommendation(data.data)
      return data.data
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendation()
  }, [fetchRecommendation])

  return {
    recommendation,
    loading,
    error,
    refetch: fetchRecommendation,
  }
}