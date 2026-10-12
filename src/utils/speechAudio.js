// Centralized reliable audio and speech synthesis utility for LexiGrow
// Solves:
// 1. Chrome V8 garbage collection of SpeechSynthesisUtterance.
// 2. Linux / mobile / browser environments lacking speech-dispatcher or local TTS voice packs.
// 3. Chromium race condition when cancel() is followed immediately by speak().
// 4. Stuck / paused speechSynthesis state (calling resume()).
// 5. Dual-engine: primary native MP3 audio stream via Google TTS with automatic fallback to Web Speech API.

let activeAudio = null
let activeUtterance = null

function getGlobalScope() {
  if (typeof window !== 'undefined') return window
  if (typeof globalThis !== 'undefined') return globalThis
  return {}
}

/**
 * Stops all current speech or audio playback immediately.
 */
export function stopAudioPlayback() {
  if (activeAudio) {
    try {
      activeAudio.pause()
      activeAudio.currentTime = 0
    } catch {
      // ignore
    }
    activeAudio = null
  }

  const globalScope = getGlobalScope()
  if ('speechSynthesis' in globalScope && globalScope.speechSynthesis) {
    try {
      globalScope.speechSynthesis.cancel()
    } catch {
      // ignore
    }
    activeUtterance = null
    if (globalScope.__lexigrowCurrentUtterance) {
      globalScope.__lexigrowCurrentUtterance = null
    }
  }
}

/**
 * Plays English pronunciation for a word or sentence.
 * @param {string} text - Text to pronounce
 * @param {object} [options]
 * @param {function} [options.onStart] - Callback when playback starts
 * @param {function} [options.onEnd] - Callback when playback completes or fails
 * @param {function} [options.onError] - Callback on error
 * @returns {function} Cleanup / stop function
 */
export function playEnglishAudio(text, { onStart, onEnd, onError } = {}) {
  if (typeof text !== 'string') {
    onError?.(new Error('Invalid text for audio playback'))
    onEnd?.()
    return () => {}
  }

  const cleanText = text.trim()
  if (!cleanText) {
    onEnd?.()
    return () => {}
  }

  // Stop any currently playing audio before starting new playback
  stopAudioPlayback()

  let finished = false
  const safeEnd = () => {
    if (!finished) {
      finished = true
      onEnd?.()
    }
  }

  const safeStart = () => {
    onStart?.()
  }

  // Strategy B: Web Speech API (with all standard Chromium / WebKit fixes)
  const playWithWebSpeech = () => {
    const globalScope = getGlobalScope()
    const synth = globalScope.speechSynthesis
    if (!synth || typeof synth.speak !== 'function') {
      safeEnd()
      onError?.(new Error('Audio playback not supported in this environment'))
      return
    }

    try {
      if (synth.paused && typeof synth.resume === 'function') {
        synth.resume()
      }

      const UtteranceClass = globalScope.SpeechSynthesisUtterance || (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null)
      if (!UtteranceClass) {
        safeEnd()
        onError?.(new Error('SpeechSynthesisUtterance is not available'))
        return
      }

      const utterance = new UtteranceClass(cleanText)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1

      // Select an English voice if available
      try {
        const voices = synth.getVoices?.() || []
        const enVoice = voices.find(v => v.lang === 'en-US') ||
                        voices.find(v => v.lang === 'en-GB') ||
                        voices.find(v => v.lang?.startsWith('en'))
        if (enVoice) {
          utterance.voice = enVoice
        }
      } catch {
        // Voice lookup error fallback
      }

      // CRITICAL: Prevent Chrome GC from collecting utterance before it finishes speaking
      activeUtterance = utterance
      globalScope.__lexigrowCurrentUtterance = utterance

      utterance.onstart = () => {
        safeStart()
      }

      utterance.onend = () => {
        if (activeUtterance === utterance) {
          activeUtterance = null
          globalScope.__lexigrowCurrentUtterance = null
        }
        safeEnd()
      }

      utterance.onerror = (e) => {
        if (activeUtterance === utterance) {
          activeUtterance = null
          globalScope.__lexigrowCurrentUtterance = null
        }
        safeEnd()
        onError?.(e)
      }

      // 40ms delay after cancel to prevent Chrome asynchronous cancel race condition
      setTimeout(() => {
        try {
          if (synth.paused && typeof synth.resume === 'function') {
            synth.resume()
          }
          synth.speak(utterance)
        } catch (err) {
          safeEnd()
          onError?.(err)
        }
      }, 40)
    } catch (err) {
      safeEnd()
      onError?.(err)
    }
  }

  // Strategy A: HTML5 Audio stream via LexiGrow server proxy (/api/audio/tts)
  // Native MP3 format served from same origin without Google third-party referer blocking
  const playWithAudioStream = () => {
    const AudioClass = typeof Audio !== 'undefined' ? Audio : (getGlobalScope().Audio || null)
    if (!AudioClass) {
      playWithWebSpeech()
      return
    }

    try {
      const encoded = encodeURIComponent(cleanText.slice(0, 300))
      const url = `/api/audio/tts?text=${encoded}&lang=en`
      const audio = new AudioClass(url)
      activeAudio = audio

      audio.onplay = () => {
        safeStart()
      }

      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null
        safeEnd()
      }

      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null
        // Fallback to Web Speech API
        playWithWebSpeech()
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (activeAudio === audio) activeAudio = null
          // Fallback to Web Speech API
          playWithWebSpeech()
        })
      }
    } catch {
      playWithWebSpeech()
    }
  }

  // Initiate playback
  playWithAudioStream()

  return stopAudioPlayback
}
