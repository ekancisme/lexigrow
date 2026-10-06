import { useEffect, useState } from 'react'
import api from '../services/api.js'

// Each resource owns its deadline, retry and cleanup; one slow request cannot
// prevent another section from rendering or overwrite a later retry.
export default function useDashboardResource(endpoint, timeoutMs = 5000) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ response: null, error: null, loading: true })

  useEffect(() => {
    const controller = new AbortController()
    api.get(endpoint, { timeoutMs, signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setState({ response, error: null, loading: false })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ response: null, error, loading: false })
      })
    return () => controller.abort()
  }, [endpoint, timeoutMs, attempt])

  const retry = () => {
    setState({ response: null, error: null, loading: true })
    setAttempt((value) => value + 1)
  }
  return { ...state, retry }
}
