import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './AssignmentManagement.css'

export default function AssignmentManagement() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'past_due'

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deletingAssignment, setDeletingAssignment] = useState(null)
  const [saving, setSaving] = useState(false)

  // Toast state
  const [toast, setToast] = useState(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    keywordsInput: '',
    keywords: [],
  })

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Minimum datetime string for datetime-local picker (current date + 1 min)
  const minimumDueDate = (() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 1)
    const pad = (num) => String(num).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  })()

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [assignRes, classRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/classes')
      ])

      setAssignments(assignRes.data || [])
      setClasses(classRes.data || [])
    } catch (err) {
      console.error('Error loading assignments page data:', err)
      showToast('Failed to load assignments: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingAssignment(null)
    setForm({
      title: '',
      description: '',
      classId: classes.length > 0 ? classes[0]._id : '',
      dueDate: '',
      keywordsInput: '',
      keywords: [],
    })
    setShowModal(true)
  }

  function openEditModal(assign) {
    setEditingAssignment(assign)
    // Format date for datetime-local picker
    let formattedDate = ''
    if (assign.dueDate) {
      const d = new Date(assign.dueDate)
      const pad = (num) => String(num).padStart(2, '0')
      formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    setForm({
      title: assign.title || '',
      description: assign.description || '',
      classId: assign.classId?._id || assign.classId || (classes[0]?._id || ''),
      dueDate: formattedDate,
      keywordsInput: '',
      keywords: assign.keywords || [],
    })
    setShowModal(true)
  }

  function handleKeywordAdd() {
    const kw = form.keywordsInput.trim()
    if (kw && !form.keywords.includes(kw)) {
      setForm(prev => ({
        ...prev,
        keywords: [...prev.keywords, kw],
        keywordsInput: ''
      }))
    }
  }

  function handleKeywordRemove(kw) {
    setForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== kw)
    }))
  }

  async function handleSaveAssignment(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.dueDate || !form.classId) {
      showToast('Please fill in all required fields (Class, Title, Due Date)', 'error')
      return
    }

    if (!editingAssignment && new Date(form.dueDate) <= new Date()) {
      showToast('Due date must be in the future', 'error')
      return
    }

    setSaving(true)
    try {
      if (editingAssignment) {
        // Update existing assignment
        const res = await api.put(`/assignments/${editingAssignment._id}`, {
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          keywords: form.keywords,
        })
        showToast(`Assignment "${res.data.title}" updated successfully!`)
      } else {
        // Create new assignment
        const res = await api.post('/assignments', {
          title: form.title,
          description: form.description,
          classId: form.classId,
          dueDate: form.dueDate,
          keywords: form.keywords,
        })
        showToast(`Assignment "${res.data.title}" created successfully!`)
      }

      setShowModal(false)
      loadData()
    } catch (err) {
      showToast('Error saving assignment: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingAssignment) return
    try {
      await api.delete(`/assignments/${deletingAssignment._id}`)
      showToast(`Assignment "${deletingAssignment.title}" deleted`)
      setDeletingAssignment(null)
      loadData()
    } catch (err) {
      showToast('Error deleting assignment: ' + err.message, 'error')
    }
  }

  // Filtering assignments
  const filteredAssignments = assignments.filter(item => {
    // Class filter
    const itemClassId = item.classId?._id || item.classId
    if (selectedClassId !== 'all' && itemClassId !== selectedClassId) {
      return false
    }

    // Status filter
    const isPastDue = new Date(item.dueDate) < new Date()
    if (statusFilter === 'active' && isPastDue) return false
    if (statusFilter === 'past_due' && !isPastDue) return false

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const titleMatch = item.title?.toLowerCase().includes(q)
      const descMatch = item.description?.toLowerCase().includes(q)
      const classNameMatch = item.classId?.name?.toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !classNameMatch) return false
    }

    return true
  })

  // Statistics calculation
  const totalCount = assignments.length
  const activeCount = assignments.filter(a => new Date(a.dueDate) >= new Date()).length
  const pastDueCount = totalCount - activeCount
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0)

  return (
    <div className="am">
      {/* Toast Notification */}
      {toast && (
        <div className={`am__toast am__toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="am__header">
        <div>
          <h2 className="text-headline-lg">Assignment Management</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Create, monitor, and manage writing prompts across all your active classes.
          </p>
        </div>
        <button className="am__btn-primary" onClick={openCreateModal}>
          <span className="material-symbols-outlined">add</span>
          Create Assignment
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="am__stats-grid">
        <div className="am__stat-card card-base">
          <div className="am__stat-icon am__stat-icon--primary">
            <span className="material-symbols-outlined">assignment</span>
          </div>
          <div>
            <p className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{totalCount}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', margin: 0 }}>Total Assignments</p>
          </div>
        </div>

        <div className="am__stat-card card-base">
          <div className="am__stat-icon am__stat-icon--success">
            <span className="material-symbols-outlined">timer</span>
          </div>
          <div>
            <p className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{activeCount}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', margin: 0 }}>Active / Open</p>
          </div>
        </div>

        <div className="am__stat-card card-base">
          <div className="am__stat-icon am__stat-icon--warn">
            <span className="material-symbols-outlined">event_busy</span>
          </div>
          <div>
            <p className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{pastDueCount}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', margin: 0 }}>Past Due</p>
          </div>
        </div>

        <div className="am__stat-card card-base">
          <div className="am__stat-icon am__stat-icon--info">
            <span className="material-symbols-outlined">send</span>
          </div>
          <div>
            <p className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{totalSubmissions}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', margin: 0 }}>Total Submissions</p>
          </div>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <div className="am__controls card-base">
        <div className="am__search-wrap">
          <span className="material-symbols-outlined am__search-icon">search</span>
          <input
            type="text"
            className="am__search-input"
            placeholder="Search assignments by title or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="am__filters">
          {/* Class Filter */}
          <div className="am__filter-group">
            <label className="text-label-sm">Class:</label>
            <select
              className="am__select"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="all">All Classes ({classes.length})</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="am__status-tabs">
            <button
              className={`am__tab ${statusFilter === 'all' ? 'am__tab--active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({assignments.length})
            </button>
            <button
              className={`am__tab ${statusFilter === 'active' ? 'am__tab--active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`am__tab ${statusFilter === 'past_due' ? 'am__tab--active' : ''}`}
              onClick={() => setStatusFilter('past_due')}
            >
              Past Due ({pastDueCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="am__loading">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
            progress_activity
          </span>
          <p className="text-body-md" style={{ marginTop: 12 }}>Loading assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card-base am__empty">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-outline)' }}>
            assignment_late
          </span>
          <h3 className="text-title-lg" style={{ marginTop: 12 }}>No Assignments Found</h3>
          <p className="text-body-md" style={{ color: 'var(--color-outline)', maxWidth: 420 }}>
            {search || selectedClassId !== 'all' || statusFilter !== 'all'
              ? 'No assignments match your current filters. Try adjusting your search or filters.'
              : 'You haven\'t created any writing assignments yet. Create your first assignment to guide student writing!'}
          </p>
          <button className="am__btn-primary" onClick={openCreateModal} style={{ marginTop: 16 }}>
            <span className="material-symbols-outlined">add</span>
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="am__grid">
          {filteredAssignments.map(a => {
            const isPastDue = new Date(a.dueDate) < new Date()
            const className = a.classId?.name || 'Class'
            const enrolledCount = a.classId?.students?.length || 0
            const submittedCount = a.submissionCount || 0
            const progressPercent = enrolledCount > 0 ? Math.min(100, Math.round((submittedCount / enrolledCount) * 100)) : 0

            return (
              <div key={a._id} className="card-base am__card">
                <div className="am__card-header">
                  <div className="am__card-class-tag">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>school</span>
                    <span>{className}</span>
                  </div>
                  <span className={`am__card-status ${isPastDue ? 'am__card-status--expired' : 'am__card-status--active'}`}>
                    {isPastDue ? 'Past Due' : 'Active'}
                  </span>
                </div>

                <h3 className="text-title-md am__card-title" onClick={() => navigate(`/teacher/assignment/${a._id}`)}>
                  {a.title}
                </h3>

                {a.description && (
                  <p className="text-body-sm am__card-desc">
                    {a.description}
                  </p>
                )}

                {/* Submission Progress Bar */}
                <div className="am__card-progress-section">
                  <div className="am__card-progress-meta">
                    <span className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      Submissions: <strong>{submittedCount}</strong> / {enrolledCount > 0 ? enrolledCount : '?'} enrolled
                    </span>
                    <span className="text-label-sm" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="am__card-progress-track">
                    <div className="am__card-progress-bar" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* Keywords Tags */}
                {a.keywords && a.keywords.length > 0 && (
                  <div className="am__card-keywords">
                    {a.keywords.map(kw => (
                      <span key={kw} className="am__keyword-chip">#{kw}</span>
                    ))}
                  </div>
                )}

                {/* Meta & Footer Actions */}
                <div className="am__card-footer">
                  <div className="am__card-due">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: isPastDue ? 'var(--color-error)' : 'var(--color-primary)' }}>
                      {isPastDue ? 'event_busy' : 'calendar_today'}
                    </span>
                    <span style={{ color: isPastDue ? 'var(--color-error)' : 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>
                      {new Date(a.dueDate).toLocaleDateString()} {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="am__card-actions">
                    <button
                      className="am__action-btn am__action-btn--view"
                      onClick={() => navigate(`/teacher/assignment/${a._id}`)}
                      title="View Submissions & Details"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                      Submissions
                    </button>
                    <button
                      className="am__action-btn"
                      onClick={() => openEditModal(a)}
                      title="Edit Assignment"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      className="am__action-btn am__action-btn--delete"
                      onClick={() => setDeletingAssignment(a)}
                      title="Delete Assignment"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CREATE / EDIT ASSIGNMENT MODAL
      ═══════════════════════════════════════════ */}
      {showModal && (
        <div className="am__overlay" onClick={() => setShowModal(false)}>
          <div className="am__modal card-base" onClick={e => e.stopPropagation()}>
            <div className="am__modal-header">
              <h3 className="text-headline-md">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <button className="am__icon-btn" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="am__modal-form">
              {/* Class Selection (Only when creating) */}
              {!editingAssignment && (
                <div>
                  <label className="text-label-md am__field-label">Target Class *</label>
                  <select
                    className="am__input"
                    value={form.classId}
                    onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}
                    required
                  >
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-label-md am__field-label">Assignment Title *</label>
                <input
                  type="text"
                  className="am__input"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Persuasive Essay on Climate Action"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-label-md am__field-label">Description / Instructions</label>
                <textarea
                  className="am__textarea"
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Provide instructions, rubric guidelines, or background context for students..."
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="text-label-md am__field-label">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  className="am__input"
                  value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  min={minimumDueDate}
                  required
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="text-label-md am__field-label">Target Vocabulary Keywords (optional)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    className="am__input"
                    style={{ flex: 1 }}
                    value={form.keywordsInput}
                    onChange={e => setForm(p => ({ ...p, keywordsInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleKeywordAdd() } }}
                    placeholder="Add a target vocabulary word and press Enter"
                  />
                  <button type="button" onClick={handleKeywordAdd} className="am__btn-outline" style={{ padding: '0 16px' }}>
                    Add
                  </button>
                </div>
                {form.keywords.length > 0 && (
                  <div className="am__keywords-list">
                    {form.keywords.map(kw => (
                      <span key={kw} className="am__modal-keyword-chip">
                        #{kw}
                        <button type="button" onClick={() => handleKeywordRemove(kw)} className="am__kw-remove-btn">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="am__modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="am__btn-outline">
                  Cancel
                </button>
                <button type="submit" className="am__btn-primary" disabled={saving}>
                  <span className="material-symbols-outlined">save</span>
                  {saving ? 'Saving...' : (editingAssignment ? 'Save Changes' : 'Create Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════════ */}
      {deletingAssignment && (
        <div className="am__overlay" onClick={() => setDeletingAssignment(null)}>
          <div className="am__modal card-base" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 className="text-headline-md" style={{ color: 'var(--color-error)' }}>Delete Assignment?</h3>
            <p className="text-body-md" style={{ margin: '12px 0 20px 0', color: 'var(--color-on-surface-variant)' }}>
              Are you sure you want to delete <strong>"{deletingAssignment.title}"</strong>? This will remove the assignment prompt.
            </p>
            <div className="am__modal-actions">
              <button className="am__btn-outline" onClick={() => setDeletingAssignment(null)}>
                Cancel
              </button>
              <button className="am__btn-delete" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
