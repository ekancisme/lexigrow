import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '../../hooks/useChat.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import chatService from '../../services/chat.service.js'
import './AdminChat.css'

const AdminChat = () => {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [roomError, setRoomError] = useState(null)

  // Use chat hook for the selected room
  const {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    loadHistory,
    markRoomRead,
    messagesEndRef,
    setMessages
  } = useChat(selectedRoom || 'support')

  // Load available rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true)
        const response = await chatService.getRooms()
        setRooms(response.data || [])
        // Auto-select first room with unread messages or first room
        if (response.data && response.data.length > 0) {
          const unreadRoom = response.data.find(r => r.unreadCount > 0)
          setSelectedRoom(unreadRoom ? unreadRoom.room : response.data[0].room)
        } else {
          // Default to support room
          setSelectedRoom('support')
        }
        setRoomError(null)
      } catch (err) {
        setRoomError(err.message || 'Không thể tải danh sách phòng chat.')
      } finally {
        setLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [])

  // When room changes, mark as read and load history
  useEffect(() => {
    if (selectedRoom) {
      markRoomRead()
      loadHistory()
    }
  }, [selectedRoom, markRoomRead, loadHistory])

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const input = e.target.elements.message
    if (!input.value.trim()) return

    const success = await sendMessage(input.value.trim())
    if (success) {
      input.value = ''
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
  }

  const getRoomDisplayName = (room) => {
    if (room === 'support') return 'Hỗ trợ chung'
    if (room.startsWith('user:')) {
      const userId = room.replace('user:', '')
      const roomData = rooms.find(r => r.room === room)
      if (roomData && roomData.user) {
        return `${roomData.user.name} (${roomData.user.email})`
      }
      return `Người dùng ${userId.slice(0, 8)}`
    }
    return room
  }

  if (loadingRooms) {
    return <div className="admin-chat-loading">Đang tải phòng chat...</div>
  }

  if (roomError) {
    return <div className="admin-chat-error">{roomError}</div>
  }

  return (
    <div className="admin-chat">
      <div className="admin-chat-sidebar">
        <h3 className="admin-chat-sidebar-title">📬 Phòng chat</h3>
        <div className="admin-chat-room-list">
          {rooms.length === 0 && (
            <div className="admin-chat-empty-rooms">Chưa có phòng chat nào.</div>
          )}
          {rooms.map((room) => (
            <button
              key={room.room}
              className={`admin-chat-room-item ${selectedRoom === room.room ? 'active' : ''}`}
              onClick={() => handleRoomSelect(room.room)}
            >
              <div className="admin-chat-room-name">
                {getRoomDisplayName(room.room)}
              </div>
              <div className="admin-chat-room-meta">
                {room.unreadCount > 0 && (
                  <span className="admin-chat-unread-badge">{room.unreadCount}</span>
                )}
                <span className="admin-chat-room-time">
                  {formatTime(room.lastMessageAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-chat-main">
        {selectedRoom ? (
          <>
            <div className="admin-chat-header">
              <span className="admin-chat-room-title">
                {getRoomDisplayName(selectedRoom)}
              </span>
              <span className={`admin-chat-status ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? '● Trực tuyến' : '● Đang kết nối...'}
              </span>
            </div>

            <div className="admin-chat-messages">
              {isLoading && (
                <div className="admin-chat-loading-msg">Đang tải tin nhắn...</div>
              )}
              {error && (
                <div className="admin-chat-error-msg">{error}</div>
              )}
              {!isLoading && messages.length === 0 && !error && (
                <div className="admin-chat-empty-msg">Chưa có tin nhắn trong phòng này.</div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.sender?._id === user?._id
                return (
                  <div
                    key={msg._id}
                    className={`admin-chat-msg ${isOwn ? 'own' : 'other'}`}
                  >
                    <div className="admin-chat-msg-sender">
                      {msg.sender?.name || 'Hệ thống'}
                      {msg.sender?.role === 'admin' && ' ⭐'}
                    </div>
                    <div className="admin-chat-msg-content">
                      <div className="admin-chat-msg-text">{msg.content}</div>
                      <div className="admin-chat-msg-time">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="admin-chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                name="message"
                placeholder="Nhập tin nhắn..."
                disabled={!isConnected}
                className="admin-chat-input"
              />
              <button type="submit" disabled={!isConnected} className="admin-chat-send-btn">
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="admin-chat-no-room">Chọn một phòng chat để bắt đầu.</div>
        )}
      </div>
    </div>
  )
}

export default AdminChat