import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getSocket, connectSocket } from '../services/socket.js'
import chatService from '../services/chat.service.js'

export function useChat(room = 'support') {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(() => Boolean(getSocket()?.connected))
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Connect to socket
  useEffect(() => {
    if (!user) return

    const socket = getSocket() || connectSocket()
    socketRef.current = socket

    const handleConnect = () => {
      setIsConnected(true)
      setError(null)
      socket.emit('join_chat_room', room)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleChatMessage = (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
    }

    const handleChatError = (data) => {
      setError(data.message)
    }

    if (socket.connected) {
      socket.emit('join_chat_room', room)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('chat_message', handleChatMessage)
    socket.on('chat_error', handleChatError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('chat_message', handleChatMessage)
      socket.off('chat_error', handleChatError)
    }
  }, [user, room])

  // Load initial messages
  const loadHistory = useCallback(async (limit = 50) => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await chatService.getHistory(room, limit)
      setMessages(response.data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử chat.')
    } finally {
      setIsLoading(false)
    }
  }, [room, user])

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