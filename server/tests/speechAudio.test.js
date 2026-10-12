import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { playEnglishAudio, stopAudioPlayback } from '../../src/utils/speechAudio.js'

describe('speechAudio utility', () => {
  beforeEach(() => {
    // Reset global state
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

  it('creates an Audio instance with Google Translate TTS endpoint', () => {
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
    expect(playedUrl).toContain('https://translate.google.com/translate_tts')
    expect(playedUrl).toContain('q=routine')
    expect(playedUrl).toContain('tl=en')
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
      cancel: () => { cancelCalled = true },
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
})
