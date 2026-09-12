import { useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext.jsx'
import chatService from '../services/chat.service.js'

export function useChat(room = 'support') {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Connect to socket
  useEffect(() => {
    if (!token || !user) return

    const socket = io({
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      // Join the chat room
      socket.emit('join_chat_room', room)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      setError('Không thể kết nối đến máy chủ chat.')
      console.error('Socket connection error:', err)
    })

    socket.on('chat_message', (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
    })

    socket.on('chat_error', (data) => {
      setError(data.message)
    })

    return () => {
      socket.disconnect()
    }
  }, [token, user, room])

  // Load initial messages
  const loadHistory = useCallback(async (limit = 50) => {
    if (!token || !user) return
    setIsLoading(true)
    try {
      const response = await chatService.getHistory(room, limit)
      setMessages(response.data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử chat.')
    } finally {
      setIsLoading(false)
    }
  }, [room, token, user])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Send message
  const sendMessage = useCallback(async (content, recipientId = null) => {
    if (!content || content.trim().length === 0) {
      setError('Nội dung tin nhắn không được để trống.')
      return false
    }

    try {
      // Try via socket first
      if (socketRef.current && isConnected) {
        socketRef.current.emit('send_chat_message', {
          content: content.trim(),
          recipientId,
          room,
        })
        return true
      }

      // Fallback to REST
      const response = await chatService.sendMessage(content, recipientId, room)
      if (response.data) {
        setMessages((prev) => [...prev, response.data])
      }
      return true
    } catch (err) {
      setError(err.message || 'Không thể gửi tin nhắn.')
      return false
    }
  }, [room, isConnected])

  // Mark room as read (admin only)
  const markRoomRead = useCallback(async () => {
    try {
      await chatService.markRoomRead(room)
    } catch (err) {
      console.error('Failed to mark room read:', err)
    }
  }, [room])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    loadHistory,
    markRoomRead,
    messagesEndRef,
    setMessages,
  }
}