import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '../../hooks/useChat.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ChatWidget.css'

const ChatWidget = () => {
  const { isAuthenticated, user } = useAuth()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesContainerRef = useRef(null)

  // Use the chat hook for support room
  const { messages, sendMessage, isConnected, isLoading, error, loadHistory, messagesEndRef } = useChat('support')

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Only show chat if user is authenticated — keep this AFTER all hooks so hook order stays stable
  if (!isAuthenticated || !user) return null

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Load history when opening
      loadHistory()
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const success = await sendMessage(inputMessage.trim())
    if (success) {
      setInputMessage('')
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="chat-widget">
      {/* Floating button */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={toggleChat} aria-label={t('chat.open', 'Open chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-title">{t('chat.title', 'LexiGrow Support')}</span>
              <span className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? t('chat.online', '● Online') : t('chat.connecting', '● Connecting...')}
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
              {isLoading && (
                <div className="chat-loading">{t('chat.loading', 'Loading messages...')}</div>
              )}
              {error && (
                <div className="chat-error">{error}</div>
              )}
              {!isLoading && messages.length === 0 && !error && (
                <div className="chat-empty">
                  <p>{t('chat.emptyTitle', 'Hi there! Send a message to get support.')}</p>
                  <p className="chat-empty-sub">{t('chat.emptySub', 'We will get back to you as soon as possible.')}</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`chat-message ${msg.sender?._id === user?._id ? 'own' : 'other'}`}
                >
                  <div className="chat-message-content">
                    <div className="chat-message-sender">
                      {msg.sender?.name || t('chat.system', 'System')}
                      {msg.sender?.role === 'admin' && ' ⭐'}
                    </div>
                    <div className="chat-message-text">{msg.content}</div>
                    <div className="chat-message-time">{formatTime(msg.createdAt)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input area */}
          {!isMinimized && (
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={t('chat.inputPlaceholder', 'Type a message...')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={!isConnected}
                className="chat-input"
              />
              <button type="submit" disabled={!isConnected || !inputMessage.trim()} className="chat-send-btn">
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