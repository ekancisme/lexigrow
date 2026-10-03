import { randomUUID } from 'node:crypto'
import { completeAI } from './aiGateway.service.js'

export async function completeThroughRelay(options) {
  const relayUrl = process.env.AI_RELAY_INTERNAL_URL
  if (!relayUrl || process.env.AI_RELAY_SERVER === 'true') return completeAI(options)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30000)
  const requestId = randomUUID()
  try {
    const response = await fetch(`${relayUrl.replace(/\/$/, '')}/internal/ai/v1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_RELAY_SERVICE_TOKEN || ''}`,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(options),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(payload.error || 'AI relay request failed')
      error.status = response.status
      error.code = payload.code || 'AI_RELAY_ERROR'
      error.attempts = payload.attempts
      throw error
    }
    return payload.data || payload
  } finally {
    clearTimeout(timeout)
  }
}
