import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createAiLimiter } from '../src/middleware/learningRateLimit.js'
describe('AI rate limit', () => {
  it('returns 429 for an exhausted student but leaves another student available', async () => {
    const app = express()
    app.use((req, res, next) => {
      req.user = { _id: req.get('X-Test-User') || 'a' }
      next()
    })
    app.use(createAiLimiter({ limit: 2, windowMs: 60000 }))
    app.get('/', (req, res) => res.json({ ok: true }))
    await request(app).get('/').expect(200)
    await request(app).get('/').expect(200)
    const blocked = await request(app).get('/').expect(429)
    expect(blocked.headers['retry-after']).toBeDefined()
    await request(app).get('/').set('X-Test-User', 'b').expect(200)
  })
})
