import { Router } from 'express'

const router = Router()

// In-memory cache for audio buffers (max 500 items)
const ttsCache = new Map()
const MAX_CACHE_SIZE = 500

/**
 * GET /api/audio/tts
 * Query: ?text=routine&lang=en
 * Proxies TTS audio to avoid client-side Referrer blocking by Google Translate.
 */
router.get('/tts', async (req, res) => {
  try {
    const rawText = req.query.text
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ success: false, message: 'Text query parameter is required' })
    }

    const cleanText = rawText.trim().slice(0, 300)
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Text cannot be empty' })
    }

    const lang = (req.query.lang || 'en').toLowerCase().slice(0, 5)
    const cacheKey = `${lang}:${cleanText.toLowerCase()}`

    // Check memory cache
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.setHeader('Accept-Ranges', 'bytes')
      return res.send(cached)
    }

    // Engine 1: Google Translate TTS via server fetch (no client-side referer block)
    try {
      const encoded = encodeURIComponent(cleanText)
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encoded}`
      const googleRes = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      })

      if (googleRes.ok) {
        const arrayBuf = await googleRes.arrayBuffer()
        const buffer = Buffer.from(arrayBuf)

        if (buffer.length > 0) {
          if (ttsCache.size >= MAX_CACHE_SIZE) {
            const firstKey = ttsCache.keys().next().value
            ttsCache.delete(firstKey)
          }
          ttsCache.set(cacheKey, buffer)

          res.setHeader('Content-Type', 'audio/mpeg')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.setHeader('Accept-Ranges', 'bytes')
          return res.send(buffer)
        }
      }
    } catch {
      // Fallback to dictionary API
    }

    // Engine 2: Free Dictionary API audio (for single English words)
    if (!cleanText.includes(' ') && lang.startsWith('en')) {
      try {
        const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanText)}`
        const dictRes = await fetch(dictUrl)
        if (dictRes.ok) {
          const dictJson = await dictRes.json()
          const audioUrl = dictJson?.[0]?.phonetics?.find(p => p.audio && p.audio.endsWith('.mp3'))?.audio
          if (audioUrl) {
            const audioRes = await fetch(audioUrl)
            if (audioRes.ok) {
              const buffer = Buffer.from(await audioRes.arrayBuffer())
              if (buffer.length > 0) {
                if (ttsCache.size >= MAX_CACHE_SIZE) {
                  const firstKey = ttsCache.keys().next().value
                  ttsCache.delete(firstKey)
                }
                ttsCache.set(cacheKey, buffer)

                res.setHeader('Content-Type', 'audio/mpeg')
                res.setHeader('Cache-Control', 'public, max-age=86400')
                res.setHeader('Accept-Ranges', 'bytes')
                return res.send(buffer)
              }
            }
          }
        }
      } catch {
        // Fallback failed
      }
    }

    return res.status(404).json({ success: false, message: 'Audio stream could not be generated' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error while fetching audio' })
  }
})

export default router
