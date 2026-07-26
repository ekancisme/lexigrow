import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import { useModal } from '../../contexts/ModalContext.jsx'
import { getSocket } from '../../services/socket.js'
import './AssignmentDetail.css'

export default function AssignmentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showConfirm } = useModal()

  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    keywordsInput: '',
    keywords: [],
    status: 'active'
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Load Assignment and Submissions ──
  async function loadData() {
    try {
      const assignRes = await api.get(`/assignments/${id}`)
      setAssignment(assignRes.data)

      // Convert Date to string matching "YYYY-MM-DDThh:mm" for datetime-local input
      let formattedDate = ''
      if (assignRes.data.dueDate) {
        const date = new Date(assignRes.data.dueDate)
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - offset * 60 * 1000)
        formattedDate = localDate.toISOString().slice(0, 16)
      }

      setEditForm({
        title: assignRes.data.title || '',
        description: assignRes.data.description || '',
        dueDate: formattedDate,
        keywordsInput: '',
        keywords: assignRes.data.keywords || [],
        status: assignRes.data.status || 'active'
      })

      const subsRes = await api.get(`/assignments/${id}/submissions`)
      setSubmissions(subsRes.data || [])
    } catch (err) {
      console.error('Error loading assignment detail:', err)
      setError(err.message || 'Failed to load assignment data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const socket = getSocket()
    if (socket) {
      const handleNotification = () => {
        loadData()
      }
      socket.on('notification', handleNotification)
      return () => {
        socket.off('notification', handleNotification)
      }
    }
  }, [id])

  // ── Keyword handlers ──
  function handleKeywordAdd(e) {
    if (e) e.preventDefault()
    const kw = editForm.keywordsInput.trim()
    if (kw && !editForm.keywords.includes(kw)) {
      setEditForm(prev => ({ ...prev, keywords: [...prev.keywords, kw], keywordsInput: '' }))
    }
  }

  function handleKeywordRemove(kw) {
    setEditForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))
  }

  // ── Update Assignment ──
  async function handleUpdate(e) {
    e.preventDefault()
    if (!editForm.title.trim() || !editForm.dueDate) {
      alert('Title and due date are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        keywords: editForm.keywords,
        status: editForm.status
      }

      const originalDate = new Date(assignment.dueDate)
      const originalLocalDate = new Date(originalDate.getTime() - originalDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      if (editForm.dueDate !== originalLocalDate) {
        if (new Date(editForm.dueDate) <= new Date()) {
          alert('Due date must be in the future.')
          setSaving(false)
          return
        }
        payload.dueDate = editForm.dueDate
      }

      await api.put(`/assignments/${id}`, payload)
      loadData()
    } catch (err) {
      alert('Error updating assignment: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete Assignment ──
  async function handleDelete() {
    showConfirm('Delete Assignment', 'Are you sure you want to delete this assignment? This will unlink student essay drafts.', async () => {
      setDeleting(true)
      try {
        await api.delete(`/assignments/${id}`)
        // Go back to class overview using the classId
        if (assignment?.classId?._id) {
          navigate(`/teacher/class/${assignment.classId._id}`)
        } else {
          navigate(-1)
        }
      } catch (err) {
        alert('Error deleting assignment: ' + err.message)
        setDeleting(false)
      }
    })
  }

  if (loading) {
    return (
      <div className="assignment-detail__loading">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="assignment-detail">
        <div className="assignment-detail__empty">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>error_outline</span>
          <h3>Error loading data</h3>
          <p>{error || 'Assignment details not found.'}</p>
          <button className="class-overview__action-btn" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  // Calculate if the form values are modified compared to the original assignment data
  const hasChanges = (() => {
    if (!assignment) return false
    
    // Format the original assignment's dueDate for datetime-local comparison
    let originalFormattedDate = ''
    if (assignment.dueDate) {
      const date = new Date(assignment.dueDate)
      const offset = date.getTimezoneOffset()
      const localDate = new Date(date.getTime() - offset * 60 * 1000)
      originalFormattedDate = localDate.toISOString().slice(0, 16)
    }

    const titleChanged = editForm.title.trim() !== (assignment.title || '').trim()
    const descChanged = editForm.description.trim() !== (assignment.description || '').trim()
    const dateChanged = editForm.dueDate !== originalFormattedDate
    const statusChanged = editForm.status !== (assignment.status || 'active')
    
    // Keywords array comparison
    const originalKeywords = assignment.keywords || []
    const keywordsChanged = 
      editForm.keywords.length !== originalKeywords.length ||
      !editForm.keywords.every((kw, index) => kw === originalKeywords[index])

    return titleChanged || descChanged || dateChanged || statusChanged || keywordsChanged
  })()

  return (
    <div className="assignment-detail">
      {/* Back button */}
      <button className="assignment-detail__back" onClick={() => navigate(`/teacher/class/${assignment.classId?._id || assignment.classId}`)}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Class ({assignment.classId?.name || 'Class'})
      </button>

      {/* Header bar */}
      <div className="assignment-detail__header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 className="assignment-detail__title" style={{ margin: 0 }}>{assignment.title}</h2>
          <span className={`am__card-status ${assignment.status === 'closed' ? 'am__card-status--closed' : (new Date(assignment.dueDate) < new Date() ? 'am__card-status--expired' : 'am__card-status--active')}`} style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
            {assignment.status === 'closed' ? 'Closed' : (new Date(assignment.dueDate) < new Date() ? 'Past Due' : 'Active')}
          </span>
        </div>
        <button
          className="assignment-detail__delete-btn"
          onClick={handleDelete}
          disabled={deleting}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          Delete Assignment
        </button>
      </div>

      {/* Grid container */}
      <div className="assignment-detail__grid">
        {/* Left Column: Edit Form */}
        <section className="card-base assignment-detail__form-card">
          <h3 className="text-title-lg" style={{ margin: '0 0 8px 0', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px' }}>
            Assignment Brief
          </h3>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="assignment-detail__form-group">
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Title *</label>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                required
                className="assignment-detail__input"
              />
            </div>

            <div className="assignment-detail__form-group">
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Description</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="assignment-detail__textarea"
                placeholder="Details of the task..."
              />
            </div>

            <div className="assignment-detail__form-group">
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Due Date *</label>
              <input
                type="datetime-local"
                value={editForm.dueDate}
                onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))}
                required
                className="assignment-detail__input"
              />
            </div>

            <div className="assignment-detail__form-group">
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                className="assignment-detail__input"
                style={{ height: '42px', padding: '0 12px' }}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="assignment-detail__form-group">
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Keywords</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={editForm.keywordsInput}
                  onChange={e => setEditForm(p => ({ ...p, keywordsInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleKeywordAdd() } }}
                  placeholder="Add keyword..."
                  className="assignment-detail__input"
                />
                <button type="button" onClick={handleKeywordAdd} className="class-overview__action-btn" style={{ padding: '0 16px' }}>Add</button>
              </div>
              {editForm.keywords.length > 0 && (
                <div className="assignment-detail__keywords-wrap">
                  {editForm.keywords.map(kw => (
                    <span key={kw} className="assignment-detail__keyword-chip">
                      {kw}
                      <button type="button" onClick={() => handleKeywordRemove(kw)} className="assignment-detail__keyword-remove">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="class-overview__action-btn"
              disabled={saving || !hasChanges}
              style={{ 
                width: '100%', 
                marginTop: 8, 
                padding: '12px',
                opacity: (saving || !hasChanges) ? 0.65 : 1,
                cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Right Column: Submissions List */}
        <section className="card-base assignment-detail__subs-card">
          <div className="assignment-detail__subs-header">
            <h3 className="assignment-detail__subs-title">Student Submissions</h3>
            <span className="assignment-detail__subs-count">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="assignment-detail__empty">
              <span className="material-symbols-outlined">description</span>
              <p>No essays have been submitted for this assignment yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="assignment-detail__table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date Submitted</th>
                    <th>Words</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => {
                    const wordCount = sub.wordCount || (sub.content ? sub.content.trim().split(/\s+/).length : 0)
                    const displayDate = sub.submittedAt 
                      ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(sub.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

                    return (
                      <tr key={sub._id}>
                        <td>
                          <div className="assignment-detail__sub-student">{sub.student?.name || 'Student'}</div>
                          <div className="assignment-detail__sub-email">{sub.student?.email || 'N/A'}</div>
                        </td>
                        <td>{displayDate}</td>
                        <td>{wordCount}</td>
                        <td>
                          {sub.score !== null && sub.score !== undefined ? (
                            <span style={{
                              fontWeight: 700,
                              color: sub.score >= 8 ? '#16a34a' : sub.score >= 6 ? '#2563eb' : '#dc2626',
                              background: sub.score >= 8 ? 'rgba(22, 163, 74, 0.1)' : sub.score >= 6 ? 'rgba(37, 99, 235, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              display: 'inline-block'
                            }}>
                              {sub.score} / 10
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-outline)', fontSize: '12px' }}>Analyzing...</span>
                          )}
                        </td>
                        <td>
                          <span className={`assignment-detail__badge assignment-detail__badge--${sub.status}`}>
                            {sub.status === 'needs_revision' ? 'revision requested' : sub.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="class-overview__action-btn"
                            onClick={() => navigate(`/teacher/feedback/${sub._id}`)}
                          >
                            {sub.status === 'reviewed' ? 'Feedback' : 'Grade Essay'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
