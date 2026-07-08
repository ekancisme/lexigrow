import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './AssignmentInbox.css'

/**
 * Compute deadline status and human-readable label
 */
function getDeadlineInfo(dueDate) {
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'overdue', label: 'Overdue', daysLabel: `${Math.abs(diffDays)}d ago` }
  }
  if (diffDays <= 3) {
    return { status: 'due-soon', label: 'Due Soon', daysLabel: diffDays === 0 ? 'Today' : `${diffDays}d left` }
  }
  return { status: 'upcoming', label: 'Upcoming', daysLabel: `${diffDays}d left` }
}

export default function AssignmentInbox() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchInbox() {
      try {
        const res = await api.get('/assignments/inbox')
        setAssignments(res.data || [])
      } catch (err) {
        console.error('Error fetching assignments:', err)
        setError('Could not load assignments. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchInbox()
  }, [])

  if (loading) {
    return (
      <div className="assignment-inbox__loading">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="assignment-inbox">
        <div className="assignment-inbox__empty">
          <span className="material-symbols-outlined">error</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Count due-soon assignments
  const dueSoonCount = assignments.filter(a => {
    const { status } = getDeadlineInfo(a.dueDate)
    return status === 'due-soon'
  }).length

  return (
    <div className="assignment-inbox">
      {/* Header */}
      <div className="assignment-inbox__header">
        <h2 className="assignment-inbox__title">My Assignments</h2>
        <p className="assignment-inbox__subtitle">
          Tasks assigned by your teachers — complete them on time to improve your score.
        </p>
      </div>

      {/* Summary chips */}
      <div className="assignment-inbox__summary">
        <div className="assignment-inbox__chip assignment-inbox__chip--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>assignment</span>
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </div>
        {dueSoonCount > 0 && (
          <div className="assignment-inbox__chip assignment-inbox__chip--warn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
            {dueSoonCount} due soon
          </div>
        )}
      </div>

      {/* Assignment List */}
      {assignments.length === 0 ? (
        <div className="assignment-inbox__empty">
          <span className="material-symbols-outlined">assignment_turned_in</span>
          <h3>No assignments yet</h3>
          <p>Your teachers haven't assigned any tasks yet. Check back later!</p>
        </div>
      ) : (
        <div className="assignment-inbox__list">
          {assignments.map(assignment => {
            const { status, label, daysLabel } = getDeadlineInfo(assignment.dueDate)
            const isOverdue = status === 'overdue'

            return (
              <div key={assignment._id} className={`assignment-card assignment-card--${status}`}>
                {/* Top: title + badge */}
                <div className="assignment-card__top">
                  <h3 className="assignment-card__title">{assignment.title}</h3>
                  <span className={`assignment-badge assignment-badge--${status}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {status === 'overdue' ? 'error' : status === 'due-soon' ? 'schedule' : 'check_circle'}
                    </span>
                    {label}
                  </span>
                </div>

                {/* Meta: class, teacher, deadline */}
                <div className="assignment-card__meta">
                  <span className="assignment-card__meta-item">
                    <span className="material-symbols-outlined">school</span>
                    {assignment.classId?.name || 'Unknown class'}
                  </span>
                  <span className="assignment-card__meta-item">
                    <span className="material-symbols-outlined">person</span>
                    {assignment.teacher?.name || 'Teacher'}
                  </span>
                  <span className="assignment-card__meta-item">
                    <span className="material-symbols-outlined">calendar_today</span>
                    Due: {new Date(assignment.dueDate).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    <span style={{ marginLeft: 4, fontWeight: 700, color: status === 'overdue' ? 'var(--color-error)' : status === 'due-soon' ? '#b45309' : 'var(--color-primary)' }}>
                      ({daysLabel})
                    </span>
                  </span>
                </div>

                {/* Description */}
                {assignment.description && (
                  <p className="assignment-card__desc">{assignment.description}</p>
                )}

                {/* Keywords */}
                {assignment.keywords?.length > 0 && (
                  <div className="assignment-card__keywords">
                    <span className="assignment-card__kw-label">Keywords:</span>
                    {assignment.keywords.map((kw, i) => (
                      <span key={i} className="assignment-card__kw-chip">{kw}</span>
                    ))}
                  </div>
                )}

                {/* Footer: CTA */}
                <div className="assignment-card__footer">
                  <button
                    className={`assignment-card__btn ${isOverdue ? 'assignment-card__btn--disabled' : ''}`}
                    onClick={() => {
                      if (!isOverdue) {
                        navigate(`/student/write-essay?assignmentId=${assignment._id}`)
                      }
                    }}
                    disabled={isOverdue}
                    title={isOverdue ? 'This assignment is past due' : 'Start writing'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {isOverdue ? 'lock' : 'edit_note'}
                    </span>
                    {isOverdue ? 'Past Due' : 'Start Writing'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
