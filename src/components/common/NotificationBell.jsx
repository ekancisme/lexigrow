import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { getSocket } from '../../services/socket.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './NotificationBell.css'

/* ── Helpers ────────────────────────────────────────────── */
function formatRelativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr  = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffMin < 1)  return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHr  < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  if (diffDay < 7)  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  return new Date(dateStr).toLocaleDateString('en-GB')
}

function getTypeIcon(type) {
  switch (type) {
    case 'academic_alert': return 'school'
    case 'parent_notice':  return 'family_restroom'
    case 'feedback':       return 'rate_review'
    case 'assignment':     return 'assignment'
    default:               return 'notifications'
  }
}

/* ── NotificationBell Component ─────────────────────────── */
export default function NotificationBell() {
  const navigate    = useNavigate()
  const dropdownRef = useRef(null)
  const { token }   = useAuth()

  const [open, setOpen]           = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(false)
  const [markingAll, setMarkingAll]       = useState(false)
  const [activeToast, setActiveToast]     = useState(null)
  const [respondingId, setRespondingId]   = useState(null)
  const [responses, setResponses]         = useState({})

  const toastTimerRef = useRef(null)

  useEffect(() => {
    let active = true
    api.get('/notifications/unread-count')
      .then(res => {
        if (active) setUnreadCount(res.data?.count ?? 0)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  /* ── Socket.io live listener ── */
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (notif) => {
      // 1. Tăng số lượng thông báo chưa đọc
      setUnreadCount(prev => prev + 1)

      // 2. Thêm thông báo mới vào danh sách hiện tại
      setNotifications(prev => [notif, ...prev])

      // 3. Không tự động hiển thị Toast ở góc màn hình nữa, chỉ tăng count và update list thông báo
    }

    socket.on('notification', handleNewNotification)
    const toastTimer = toastTimerRef.current

    return () => {
      socket.off('notification', handleNewNotification)
      if (toastTimer) clearTimeout(toastTimer)
    }
  }, [open, token])

  /* ── Fetch notifications when dropdown opens ── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications?limit=15')
      setNotifications(Array.isArray(res.data) ? res.data : [])
      setUnreadCount(res.unreadCount ?? 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Close on outside click ── */
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ── Mark single notification as read ── */
  async function handleNotificationClick(notif) {
    // Đánh dấu đã đọc nếu chưa
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`)
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch {
        // non-critical
      }
    }
    // Điều hướng nếu có link
    if (notif.link) {
      navigate(notif.link)
      setOpen(false)
    }
  }

  /* ── Click Toast ── */
  async function handleToastClick(notif) {
    setActiveToast(null)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    await handleNotificationClick(notif)
  }

  /* ── Mark all as read ── */
  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Mark all read error:', err)
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleRespondParentRequest(notifId, action) {
    setRespondingId(notifId)
    try {
      const res = await api.post(`/notifications/${notifId}/respond-parent-request`, { action })
      if (res.success) {
        setResponses(prev => ({ ...prev, [notifId]: action === 'approve' ? 'approved' : 'rejected' }))
        setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, message: res.data.message, isRead: true } : n))
        const wasUnread = notifications.find(n => n._id === notifId && !n.isRead)
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setRespondingId(null)
    }
  }

  /* ── RENDER ── */
  return (
    <>
      <div className="notif-bell" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          id="notification-bell-btn"
          className={`topnav__icon-btn notif-bell__btn ${open ? 'notif-bell__btn--active' : ''}`}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-expanded={open}
          onClick={() => {
            const nextOpen = !open
            setOpen(nextOpen)
            if (nextOpen) fetchNotifications()
          }}
        >
          <span className="material-symbols-outlined">
            {open ? 'notifications_active' : 'notifications'}
          </span>
          {unreadCount > 0 && (
            <span className="notif-bell__count" aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="notif-dropdown animate-scale-in" role="dialog" aria-label="Notification list">
            {/* Header */}
            <div className="notif-dropdown__header">
              <div>
                <h3 className="text-title-lg notif-dropdown__title">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="notif-dropdown__unread-label">{unreadCount} unread</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  className="notif-dropdown__mark-all"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                >
                  {markingAll
                    ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                    : 'Mark all as read'
                  }
                </button>
              )}
            </div>

            {/* List */}
            <div className="notif-dropdown__list" role="list">
              {loading ? (
                /* Skeleton */
                [1, 2, 3].map(i => (
                  <div key={i} className="notif-item notif-item--skeleton">
                    <div className="notif-item__icon shimmer" />
                    <div className="notif-item__body">
                      <div className="notif-item__skeleton-line notif-item__skeleton-line--wide shimmer" />
                      <div className="notif-item__skeleton-line shimmer" />
                    </div>
                  </div>
                ))
              ) : notifications.length === 0 ? (
                <div className="notif-dropdown__empty">
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>
                    notifications_off
                  </span>
                  <p className="text-body-md">No notifications</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const hasActions = notif.type === 'parent_notice' && notif.relatedUser
                  const ItemTag = hasActions ? 'div' : 'button'
                  return (
                    <ItemTag
                      key={notif._id}
                      role="listitem"
                      className={`notif-item ${!notif.isRead ? 'notif-item--unread' : ''} ${notif.link && !hasActions ? 'notif-item--clickable' : ''}`}
                      onClick={() => !hasActions && handleNotificationClick(notif)}
                    >
                      <div className={`notif-item__icon notif-item__icon--${notif.type}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                          {getTypeIcon(notif.type)}
                        </span>
                      </div>
                      <div className="notif-item__body">
                        <p className="notif-item__title text-label-md">{notif.title}</p>
                        <p className={`notif-item__message text-label-sm ${hasActions ? 'notif-item__message--full' : ''}`}>{notif.message}</p>

                        {hasActions && (
                          <div className="notif-item__actions" onClick={e => e.stopPropagation()}>
                            {responses[notif._id] === 'approved' || (notif.isRead && notif.message.toLowerCase().includes('approved')) ? (
                              <span className="notif-item__status notif-item__status--approved">
                                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>check_circle</span>
                                Approved
                              </span>
                            ) : responses[notif._id] === 'rejected' || (notif.isRead && notif.message.toLowerCase().includes('declined')) ? (
                              <span className="notif-item__status notif-item__status--rejected">
                                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>cancel</span>
                                Declined
                              </span>
                            ) : (
                              <>
                                <button
                                  className="notif-item__action-btn notif-item__action-btn--approve"
                                  onClick={() => handleRespondParentRequest(notif._id, 'approve')}
                                  disabled={respondingId === notif._id}
                                >
                                  Approve
                                </button>
                                <button
                                  className="notif-item__action-btn notif-item__action-btn--reject"
                                  onClick={() => handleRespondParentRequest(notif._id, 'reject')}
                                  disabled={respondingId === notif._id}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        <span className="notif-item__time">
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.isRead && <span className="notif-item__dot" aria-label="Unread" />}
                    </ItemTag>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {!loading && notifications.length > 0 && (
              <div className="notif-dropdown__footer">
                <button className="notif-dropdown__see-all" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {activeToast && createPortal(
        <div className={`notif-toast notif-toast--${activeToast.type}`} onClick={() => handleToastClick(activeToast)}>
          <div className="notif-toast__icon">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {getTypeIcon(activeToast.type)}
            </span>
          </div>
          <div className="notif-toast__body">
            <p className="notif-toast__title">{activeToast.title}</p>
            <p className="notif-toast__message">{activeToast.message}</p>
          </div>
          <button className="notif-toast__close" onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
