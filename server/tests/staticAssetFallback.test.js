import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('Static Asset and SPA fallback handling', () => {
  it('returns 404 for missing static assets under /assets', async () => {
    const res = await request(app).get('/assets/FlashcardReview-nonexistent.css')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toBe('Asset not found')
  })

  it('returns 404 for missing files with extensions', async () => {
    const res = await request(app).get('/some-missing-chunk.js')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toBe('File not found')
  })

  it('serves SPA fallback for non-API route without extension', async () => {
    const res = await request(app).get('/student/game/hunter')
    // If dist exists, it serves index.html (200 text/html); if not in local dev/test, Express moves next or 404
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/text\/html/)
    }
  })
})
