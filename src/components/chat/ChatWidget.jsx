import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../../services/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ChatWidget.css'

const STORAGE_KEY = 'luffy-chat-widget-pos'
const BUTTON_SIZE = 72
const VIEWPORT_MARGIN = 12

/** Preset quick questions — greeting first, then pricing, roadmap & AI support */
const QUICK_QUESTIONS = {
  vi: [
    { id: 'greet', label: '👋 Xin chào!', text: 'Xin chào!' },
    {
      id: 'price',
      label: '💰 Giá các gói học?',
      text: 'Bảng giá và các gói học của LexiGrow gồm những gì? Mỗi gói giá bao nhiêu?',
    },
    {
      id: 'roadmap',
      label: '🗺️ Lộ trình học thế nào?',
      text: 'Lộ trình học của LexiGrow hoạt động ra sao? Tôi nên bắt đầu từ đâu?',
    },
    {
      id: 'ai',
      label: '🤖 AI hỗ trợ được gì?',
      text: 'AI của LexiGrow hỗ trợ tôi học tập những việc gì?',
    },
  ],
  en: [
    { id: 'greet', label: '👋 Hello!', text: 'Hello!' },
    {
      id: 'price',
      label: '💰 What does it cost?',
      text: 'What subscription plans does LexiGrow offer and how much does each cost?',
    },
    {
      id: 'roadmap',
      label: '🗺️ Learning roadmap?',
      text: "How does the LexiGrow learning roadmap work? Where should I start?",
    },
    {
      id: 'ai',
      label: '🤖 What can AI do here?',
      text: 'What learning tasks can the LexiGrow AI help me with?',
    },
  ],
}

/** Default anchor: bottom-right corner */
const getDefaultPosition = () => ({
  x: window.innerWidth - BUTTON_SIZE - 24,
  y: window.innerHeight - BUTTON_SIZE - 24,
})

/** Keep the widget fully inside the viewport */
const clampPosition = (x, y) => ({
  x: Math.min(
    Math.max(x, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN),
  ),
  y: Math.min(
    Math.max(y, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN),
  ),
})

let messageId = 0
const nextId = () => `msg-${++messageId}-${Date.now()}`

const ChatWidget = () => {
  const { isAuthenticated, user } = useAuth()
  const { language, t } = useLanguage()
  const isVi = language === 'vi'

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false) // AI "composing" state
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
          return clampPosition(saved.x, saved.y)
        }
      }
    } catch {
      /* malformed storage → fallback */
    }
    return getDefaultPosition()
  })
  const messagesContainerRef = useRef(null)
  const streamTimerRef = useRef(null)
  const hasGreetedRef = useRef(false)
  const dragStateRef = useRef({ active: false, moved: false, startPointer: { x: 0, y: 0 }, startPos: { x: 0, y: 0 } })

  /* ── Drag to move Luffy anywhere on the screen (mouse + touch via Pointer Events) ── */
  const handlePointerDown = (e) => {
    if (e.button === 2) return // ignore right click
    dragStateRef.current = {
      active: true,
      moved: false,
      startPointer: { x: e.clientX, y: e.clientY },
      startPos: position || getDefaultPosition(),
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e) => {
    const drag = dragStateRef.current
    if (!drag.active) return
    const dx = e.clientX - drag.startPointer.x
    const dy = e.clientY - drag.startPointer.y
    if (!drag.moved && Math.hypot(dx, dy) < 6) return // tiny jitter = still a click
    if (!drag.moved) {
      drag.moved = true
      setIsDragging(true)
    }
    setPosition(clampPosition(drag.startPos.x + dx, drag.startPos.y + dy))
  }

  const handlePointerUp = () => {
    const drag = dragStateRef.current
    if (!drag.active) return
    drag.active = false
    if (drag.moved) {
      // Drag finished → remember the drop position
      setIsDragging(false)
      setPosition((pos) => {
        const clamped = clampPosition(pos.x, pos.y)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped))
        } catch {
          /* storage blocked → position just won't persist */
        }
        return clamped
      })
    } else {
      // Plain click (no movement) → open/close chat
      toggleChat()
    }
  }

  // Re-clamp when the viewport resizes so Luffy never escapes the screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : prev))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Always clean up any in-flight typewriter timer
  useEffect(() => () => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current)
  }, [])

  // Scroll to bottom when messages / typing state change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const formatTime = useCallback(
    (date) =>
      new Date(date).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [language],
  )

  const toggleChat = () => {
    setIsOpen((prev) => {
      const opening = !prev
      if (opening && !hasGreetedRef.current) {
        // First open → warm AI greeting
        hasGreetedRef.current = true
        setMessages([
          {
            id: nextId(),
            role: 'assistant',
            time: formatTime(new Date()),
            content: t(
              'chat.aiGreeting',
              'Xin chào 👋 Mình là Luffy — trợ lý AI của LexiGrow! Mình có thể chia sẻ về gói học, lộ trình luyện từ vựng & viết, hoặc cách AI chấm bài giúp bạn. Bạn muốn tìm hiểu điều gì trước?',
            ),
          },
        ])
      }
      return opening
    })
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  /** Reveal AI reply with a typewriter effect */
  const streamReply = useCallback((fullText) => {
    const id = nextId()
    const time = formatTime(new Date())
    setMessages((prev) => [...prev, { id, role: 'assistant', content: '', time }])

    if (streamTimerRef.current) clearInterval(streamTimerRef.current)
    let shown = 0
    streamTimerRef.current = setInterval(() => {
      shown += 4 // reveal a few characters per tick
      const slice = fullText.slice(0, shown)
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: slice } : m)),
      )
      if (shown >= fullText.length) {
        clearInterval(streamTimerRef.current)
        streamTimerRef.current = null
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: fullText } : m)),
        )
      }
    }, 18)
  }, [formatTime])

  const setUserMessageAndAsk = useCallback(
    (text) => {
      const userMsg = { id: nextId(), role: 'user', content: text, time: formatTime(new Date()) }
      const history = messages
        .filter((m) => !m.pending)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      api
        .post('/chat/ai-assistant', { message: text, history, lang: language })
        .then((result) => {
          setIsTyping(false)
          streamReply(result?.data?.reply || '')
        })
        .catch(() => {
          setIsTyping(false)
          streamReply(
            isVi
              ? 'Mình không gửi được tin nhắn lúc này 🥲 Bạn kiểm tra kết nối rồi thử lại giúp mình nhé!'
              : "I couldn't connect just now 🥲 Please check your network and try again!",
          )
        })
    },
    [formatTime, isVi, language, messages, streamReply],
  )

  /** Send a message (from input or preset chip) to the AI assistant */
  const handleSend = useCallback(
    async (rawText) => {
      const text = (rawText ?? inputMessage).trim()
      if (!text || isTyping) return

      setUserMessageAndAsk(text)
      setInputMessage('')
    },
    [inputMessage, isTyping, setUserMessageAndAsk],
  )


  // Smart window side: open above the mascot by default, below when Luffy sits near the top
  const widgetStyle = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : undefined
  const openBelow = position ? position.y < window.innerHeight / 2 : false
  const openToRight = position ? position.x < window.innerWidth / 2 - 190 : false
  const windowSideClass = [
    openBelow ? 'chat-window--below' : '',
    openToRight ? 'chat-window--right' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const quickList = QUICK_QUESTIONS[isVi ? 'vi' : 'en'] || QUICK_QUESTIONS.en

  // Only render floating chat assistant if user is signed in
  if (!isAuthenticated || !user) return null

  return (
    <div
      className={`chat-widget ${isDragging ? 'chat-widget--dragging' : ''}`}
      style={widgetStyle}
    >
      {/* Draggable Luffy floating button */}
      {!isOpen && (
        <button
          className="chat-toggle-btn"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={t('chat.open', 'Open chat')}
        >
          <video
            className="chat-toggle-btn__mascot"
            autoPlay
            loop
            muted
            playsInline
            poster="/assets/mascot/luffy-transparent.png"
            draggable="false"
            tabIndex={-1}
          >
            <source src="/assets/mascot/luffy-animated.webm" type="video/webm" />
            <source src="/assets/mascot/luffy-animated.mov" type="video/quicktime" />
            <img
              src="/assets/mascot/luffy-animated.gif"
              alt=""
              draggable="false"
              className="chat-toggle-btn__mascot"
            />
          </video>
          <span className="chat-toggle-btn__dot" aria-hidden="true" />
        </button>
      )}

      {/* AI chat window */}
      {isOpen && (
        <div className={`chat-window ${windowSideClass} ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-title">
                {t('chat.aiTitle', 'LexiGrow AI — Mónky D YunTeee')}
              </span>
              <span className="chat-status online">
                {t('chat.aiOnline', '● AI Trực tuyến')}
              </span>
            </div>
            <div className="chat-header-actions">
              <button onClick={toggleMinimize} className="chat-header-btn" aria-label={t('chat.minimize', 'Minimize')}>
                {isMinimized ? '□' : '−'}
              </button>
              <button onClick={toggleChat} className="chat-header-btn" aria-label={t('chat.close', 'Close')}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.role === 'user' ? 'own' : 'other'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="chat-message-row">
                      <img
                        src="/assets/mascot/luffy-transparent.png"
                        alt=""
                        draggable="false"
                        className="chat-avatar-mascot"
                      />
                      <div className="chat-message-content">
                        <div className="chat-message-sender">
                          {t('chat.aiName', 'Monky D YunTeee 🌟')}
                        </div>
                        <div className="chat-message-text">{msg.content}</div>
                        <div className="chat-message-time">{msg.time || ''}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-message-content">
                      <div className="chat-message-sender">
                        {user?.name || t('chat.system', 'You')}
                      </div>
                      <div className="chat-message-text">{msg.content}</div>
                      <div className="chat-message-time">{msg.time || ''}</div>
                    </div>
                  )}
                </div>
              ))}

              {/* AI composing animation */}
              {isTyping && (
                <div className="chat-message other">
                  <div className="chat-message-row">
                    <img
                      src="/assets/mascot/luffy-transparent.png"
                      alt=""
                      draggable="false"
                      className="chat-avatar-mascot"
                    />
                    <div className="chat-message-content chat-typing-bubble">
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preset quick questions (greeting → pricing → roadmap → AI support) */}
          {!isMinimized && quickList.length > 0 && (
            <div className="chat-quick-chips">
              {quickList.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="chat-quick-chip"
                  disabled={isTyping}
                  onClick={() => handleSend(q.text)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          {!isMinimized && (
            <form
              className="chat-input-area"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <input
                type="text"
                placeholder={t('chat.aiInputPlaceholder', 'Hỏi Luffy bất cứ điều gì về LexiGrow...')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isTyping}
                className="chat-input"
              />
              <button type="submit" disabled={!inputMessage.trim()} className="chat-send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4z" />
                </svg>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatWidget
