import { useState, useEffect, useRef } from 'react'
import api from '../../services/api.js'
import { getSocket } from '../../services/socket.js'
import './EssayDiscussion.css'

export default function EssayDiscussion({ essayId, currentUserId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load initial comments
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true)
        const response = await api.get(`/comments/essay/${essayId}`)
        if (response && response.success) {
          setComments(response.data)
        }
      } catch (err) {
        console.error('Error fetching comments:', err)
        setError('Failed to load discussion comments.')
      } finally {
        setLoading(false)
      }
    }

    if (essayId) {
      fetchComments()
    }
  }, [essayId])

  // Setup Socket connection for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !essayId) return

    // Join the essay comments room
    socket.emit('join_essay_comments', essayId)

    const handleNewComment = (comment) => {
      setComments((prev) => {
        // Prevent duplicate comments if the socket event arrives and we also added it locally
        if (prev.some((c) => c._id === comment._id)) {
          return prev
        }
        return [...prev, comment]
      })
    }

    socket.on('new_comment', handleNewComment)

    return () => {
      socket.off('new_comment', handleNewComment)
      socket.emit('leave_essay_comments', essayId)
    }
  }, [essayId])

  // Scroll to bottom whenever comments change
  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await api.post(`/comments/essay/${essayId}`, {
        content: newComment.trim(),
      })
      if (response && response.success) {
        const createdComment = response.data
        setComments((prev) => {
          if (prev.some((c) => c._id === createdComment._id)) {
            return prev
          }
          return [...prev, createdComment]
        })
        setNewComment('')
      }
    } catch (err) {
      console.error('Error posting comment:', err)
      setError('Could not send message. Please try again.')
    }
  }

  return (
    <div className="essay-discussion-container">
      <div className="discussion-header">
        <h3>💬 Essay Discussion & Revisions</h3>
        <p className="discussion-subtitle">Discuss updates, corrections, and revision requests here.</p>
      </div>

      {error && <div className="discussion-error">{error}</div>}

      <div className="comments-feed">
        {loading ? (
          <div className="discussion-loading">Loading discussion...</div>
        ) : comments.length === 0 ? (
          <div className="discussion-empty">
            No comments yet. Start the conversation by posting below!
          </div>
        ) : (
          comments.map((comment) => {
            const isSelf = comment.user?._id === currentUserId
            const roleBadge = comment.user?.role || 'user'
            return (
              <div
                key={comment._id}
                className={`comment-bubble-wrapper ${isSelf ? 'self' : 'other'}`}
              >
                <div className="comment-meta">
                  <span className="comment-author">{comment.user?.name || 'User'}</span>
                  <span className={`role-badge ${roleBadge}`}>{roleBadge}</span>
                </div>
                <div className="comment-bubble">
                  <p className="comment-text">{comment.content}</p>
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="discussion-input-form">
        <input
          type="text"
          placeholder="Ask a question or type revision notes..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="discussion-input"
          maxLength={1000}
        />
        <button type="submit" className="discussion-send-btn" disabled={!newComment.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
