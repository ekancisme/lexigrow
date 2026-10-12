import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { playEnglishAudio, stopAudioPlayback } from '../../src/utils/speechAudio.js'

describe('speechAudio utility and /api/audio/tts proxy', () => {
  beforeEach(() => {
    stopAudioPlayback()
  })

  afterEach(() => {
    stopAudioPlayback()
    vi.restoreAllMocks()
  })

  it('handles empty or non-string input safely without crashing', () => {
    const onEnd = vi.fn()
    const onError = vi.fn()

    playEnglishAudio('', { onEnd, onError })
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()

    playEnglishAudio(null, { onEnd, onError })
    expect(onError).toHaveBeenCalled()
  })

  it('creates an Audio instance with same-origin /api/audio/tts endpoint', () => {
    let playedUrl = ''
    let playCalled = false

    globalThis.Audio = class MockAudio {
      constructor(src) {
        playedUrl = src
        this.src = src
        this.paused = true
        this.currentTime = 0
      }
      play() {
        playCalled = true
        return Promise.resolve()
      }
      pause() {
        this.paused = true
      }
    }

    playEnglishAudio('routine')

    expect(playCalled).toBe(true)
    expect(playedUrl).toContain('/api/audio/tts')
    expect(playedUrl).toContain('text=routine')
    expect(playedUrl).toContain('lang=en')
  })

  it('stops active audio on stopAudioPlayback()', () => {
    let paused = false

    globalThis.Audio = class MockAudio {
      constructor(src) {
        this.src = src
      }
      play() {
        return Promise.resolve()
      }
      pause() {
        paused = true
      }
    }

    playEnglishAudio('routine')
    stopAudioPlayback()

    expect(paused).toBe(true)
  })

  it('falls back to SpeechSynthesis when Audio fails', async () => {
    let spokenUtterance = null
    let resumed = false

    globalThis.Audio = class MockAudio {
      play() {
        return Promise.reject(new Error('Audio playback blocked'))
      }
      pause() {}
    }

    globalThis.speechSynthesis = {
      paused: true,
      cancel: () => {},
      resume: () => { resumed = true },
      speak: (utt) => { spokenUtterance = utt },
      getVoices: () => [{ lang: 'en-US', name: 'US English' }]
    }

    globalThis.SpeechSynthesisUtterance = class MockUtterance {
      constructor(text) {
        this.text = text
        this.lang = 'en-US'
        this.rate = 1
      }
    }

    playEnglishAudio('commute')

    // Wait for the fallback setTimeout to fire (40ms)
    await new Promise((r) => setTimeout(r, 60))

    expect(resumed).toBe(true)
    expect(spokenUtterance).not.toBeNull()
    expect(spokenUtterance.text).toBe('commute')
  })

  it('rejects /api/audio/tts without text param with 400', async () => {
    const res = await request(app).get('/api/audio/tts')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('proxies audio for a word and returns audio/mpeg with 200', async () => {
    const res = await request(app).get('/api/audio/tts?text=routine')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/)
    expect(res.headers['cache-control']).toContain('public')
    expect(res.body.length).toBeGreaterThan(0)
  })
})
