import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import './ClassOverview.css'

export default function ClassOverview() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [classDetail, setClassDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  // Tab state
  const [activeTab, setActiveTab] = useState('roster')
  // Assignment state
  const [assignments, setAssignments] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '', keywordsInput: '', keywords: [] })
  const [savingAssignment, setSavingAssignment] = useState(false)
  // State for viewing details of an assignment
  const [viewingAssignment, setViewingAssignment] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '', keywordsInput: '', keywords: [], status: 'active' })
  const [deletingAssignment, setDeletingAssignment] = useState(null)

  useEffect(() => {
    if (viewingAssignment) {
      let formattedDate = ''
      if (viewingAssignment.dueDate) {
        const date = new Date(viewingAssignment.dueDate)
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - offset * 60 * 1000)
        formattedDate = localDate.toISOString().slice(0, 16)
      }
      setEditForm({
        title: viewingAssignment.title || '',
        description: viewingAssignment.description || '',
        dueDate: formattedDate,
        keywordsInput: '',
        keywords: viewingAssignment.keywords || [],
        status: viewingAssignment.status || 'active'
      })
    }
  }, [viewingAssignment])

  async function loadClassDetail() {
    try {
      const res = await api.get(`/classes/${id}`)
      setClassDetail(res.data)
    } catch (err) {
      console.error('Error fetching class details:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAssignments() {
    setAssignmentsLoading(true)
    try {
      const res = await api.get(`/assignments?classId=${id}`)
      setAssignments(res.data || [])
    } catch (err) {
      console.error('Error loading assignments:', err)
    } finally {
      setAssignmentsLoading(false)
    }
  }

  useEffect(() => {
    loadClassDetail()
    loadAssignments()
  }, [id])

  async function handleAddStudent(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await api.post(`/classes/${id}/students`, { email: inviteEmail })
      setInviteEmail('')
      alert('Student added successfully!')
      loadClassDetail()
    } catch (err) {
      alert('Error adding student: ' + err.message)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveStudent(studentId, e) {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to remove this student?')) return
    try {
      await api.delete(`/classes/${id}/students/${studentId}`)
      loadClassDetail()
    } catch (err) {
      alert('Error removing student: ' + err.message)
    }
  }

  // ── Assignment handlers ──
  function handleKeywordAdd() {
    const kw = assignmentForm.keywordsInput.trim()
    if (kw && !assignmentForm.keywords.includes(kw)) {
      setAssignmentForm(prev => ({ ...prev, keywords: [...prev.keywords, kw], keywordsInput: '' }))
    }
  }

  function handleKeywordRemove(kw) {
    setAssignmentForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))
  }

  async function handleCreateAssignment(e) {
    e.preventDefault()
    if (!assignmentForm.title.trim() || !assignmentForm.dueDate) {
      alert('Title and due date are required.')
      return
    }
    setSavingAssignment(true)
    try {
      await api.post('/assignments', {
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate,
        keywords: assignmentForm.keywords,
        classId: id,
      })
      setShowAssignmentModal(false)
      setAssignmentForm({ title: '', description: '', dueDate: '', keywordsInput: '', keywords: [] })
      loadAssignments()
    } catch (err) {
      alert('Error creating assignment: ' + err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  function handleDeleteAssignment(assignment, e) {
    e.stopPropagation()
    setDeletingAssignment(assignment)
  }

  async function confirmDeleteAssignment() {
    if (!deletingAssignment) return
    setSavingAssignment(true)
    try {
      await api.delete(`/assignments/${deletingAssignment._id}`)
      setDeletingAssignment(null)
      loadAssignments()
    } catch (err) {
      alert('Error deleting assignment: ' + err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  // ── Edit Assignment handlers ──
  function handleEditKeywordAdd() {
    const kw = editForm.keywordsInput.trim()
    if (kw && !editForm.keywords.includes(kw)) {
      setEditForm(prev => ({ ...prev, keywords: [...prev.keywords, kw], keywordsInput: '' }))
    }
  }

  function handleEditKeywordRemove(kw) {
    setEditForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))
  }

  async function handleUpdateAssignment(e) {
    e.preventDefault()
    if (!editForm.title.trim() || !editForm.dueDate) {
      alert('Title and due date are required.')
      return
    }
    setSavingAssignment(true)
    try {
      await api.put(`/assignments/${viewingAssignment._id}`, {
        title: editForm.title,
        description: editForm.description,
        dueDate: editForm.dueDate,
        keywords: editForm.keywords,
        status: editForm.status
      })
      setViewingAssignment(null)
      loadAssignments()
    } catch (err) {
      alert('Error updating assignment: ' + err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  if (loading) {
    return (
      <div className="class-overview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!classDetail) {
    return (
      <div className="class-overview" style={{ padding: 24, textAlign: 'center' }}>
        <h3 className="text-title-lg" style={{ color: 'var(--color-error)' }}>Class Not Found</h3>
        <button onClick={() => navigate('/teacher/dashboard')} className="class-overview__action-btn" style={{ marginTop: 16 }}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  const { name, roster, metrics, schedule, description } = classDetail
  const filteredRoster = (roster || []).filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  // Average class TTR
  const classTtr = roster?.length > 0
    ? (roster.reduce((sum, s) => sum + s.ttr, 0) / roster.length).toFixed(2)
    : '0.00'

  // Tab nav style helper
  const tabStyle = (tab) => ({
    padding: '10px 22px',
    borderRadius: '10px 10px 0 0',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid var(--color-primary)' : '3px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <div className="class-overview">
      <section className="class-overview__header">
        <div>
          <button className="class-overview__back" onClick={() => navigate('/teacher/dashboard')}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
          <h2 className="text-headline-lg" style={{ marginTop: 8 }}>{name}</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {roster?.length || 0} students • Avg TTR: {classTtr} • {schedule || 'No schedule'}
          </p>
        </div>
      </section>

      <section className="class-overview__metrics">
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. Words/Essay</p>
          <p className="text-headline-md">{metrics?.avgWordsPerEssay || 0}</p>
        </div>
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Total Submissions</p>
          <p className="text-headline-md">{metrics?.totalEssays || 0}</p>
        </div>
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Class TTR</p>
          <p className="text-headline-md">{classTtr}</p>
        </div>
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Class Description</p>
          <p className="text-body-md" style={{ marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {description || 'No description provided.'}
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section style={{ borderBottom: '1px solid var(--color-outline-variant)', marginBottom: 0 }}>
        <button style={tabStyle('roster')} onClick={() => setActiveTab('roster')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span>
            Student Roster
          </span>
        </button>
        <button style={tabStyle('assignments')} onClick={() => setActiveTab('assignments')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment</span>
            Assignments
            {assignments.length > 0 && (
              <span style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                {assignments.length}
              </span>
            )}
          </span>
        </button>
      </section>

      {/* ── TAB: STUDENT ROSTER ── */}
      {activeTab === 'roster' && (
      <section className="card-base" style={{ padding: 0, borderRadius: '0 12px 12px 12px' }}>
        <div className="class-overview__table-header">
          <h3 className="text-title-lg">Student Roster</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              className="class-overview__search"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                className="class-overview__search"
                placeholder="Student email..."
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
              <button type="submit" className="class-overview__action-btn" style={{ padding: '0 16px' }} disabled={inviting}>
                {inviting ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {filteredRoster.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-outline)' }}>
              No students found in this roster.
            </div>
          ) : (
            <table className="class-overview__table">
              <thead>
                <tr>
                  <th className="text-label-sm">STUDENT</th>
                  <th className="text-label-sm">LEVEL</th>
                  <th className="text-label-sm">ESSAYS</th>
                  <th className="text-label-sm">TTR</th>
                  <th className="text-label-sm">GROWTH</th>
                  <th className="text-label-sm">STATUS</th>
                  <th className="text-label-sm">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((s) => (
                  <tr key={s._id} onClick={() => navigate(`/teacher/student/${s._id}`)}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>{s.level}</td>
                    <td>{s.essays}</td>
                    <td>{s.ttr?.toFixed(2) || '0.00'}</td>
                    <td style={{ color: s.growth?.startsWith('+') ? 'var(--color-success)' : s.growth?.startsWith('-') ? 'var(--color-error)' : 'var(--color-outline)' }}>
                      {s.growth}
                    </td>
                    <td>
                      <span className={`class-overview__status class-overview__status--${s.status || 'stagnating'}`}>
                        {s.status || 'stagnating'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="class-overview__action-btn"
                        onClick={(e) => handleRemoveStudent(s._id, e)}
                        style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      )}

      {/* ── TAB: ASSIGNMENTS ── */}
      {activeTab === 'assignments' && (
      <section className="card-base" style={{ borderRadius: '0 12px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="text-title-lg">Assignments</h3>
          <button
            className="class-overview__action-btn"
            onClick={() => setShowAssignmentModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Create Assignment
          </button>
        </div>

        {assignmentsLoading ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--color-primary)' }}>progress_activity</span>
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-outline)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>assignment</span>
            No assignments yet. Create one to get started!
          </div>
        ) : (
          <table className="class-overview__table">
            <thead>
              <tr>
                <th className="text-label-sm">TITLE</th>
                <th className="text-label-sm">DUE DATE</th>
                <th className="text-label-sm">KEYWORDS</th>
                <th className="text-label-sm">STATUS</th>
                <th className="text-label-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
               {assignments.map(a => {
                const isPast = new Date(a.dueDate) < new Date()
                return (
                  <tr key={a._id} onClick={() => setViewingAssignment(a)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700 }}>{a.title}</td>
                    <td style={{ color: isPast ? 'var(--color-error)' : 'inherit' }}>
                      {new Date(a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      {a.keywords?.length > 0
                        ? <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>{a.keywords.join(', ')}</span>
                        : <span style={{ color: 'var(--color-outline)', fontSize: '0.85rem' }}>None</span>
                      }
                    </td>
                    <td>
                      <span className={`class-overview__status class-overview__status--${a.status === 'active' ? 'growing' : 'stagnating'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="class-overview__action-btn"
                        onClick={(e) => handleDeleteAssignment(a, e)}
                        style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
      )}

      {/* ── CREATE ASSIGNMENT MODAL ── */}
      {showAssignmentModal && createPortal(
        <div 
          onClick={() => setShowAssignmentModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="text-title-lg" style={{ margin: 0 }}>Create Assignment</h3>
              <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Title *</label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Assignment title..."
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                />
              </div>
              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Description</label>
                <textarea
                  value={assignmentForm.description}
                  onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the assignment task..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                />
              </div>
              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Due Date *</label>
                <input
                  type="datetime-local"
                  value={assignmentForm.dueDate}
                  onChange={e => setAssignmentForm(p => ({ ...p, dueDate: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                />
              </div>
              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Keywords (optional)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={assignmentForm.keywordsInput}
                    onChange={e => setAssignmentForm(p => ({ ...p, keywordsInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleKeywordAdd() } }}
                    placeholder="Type a keyword and press Enter or Add"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.9rem', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                  />
                  <button type="button" onClick={handleKeywordAdd} className="class-overview__action-btn" style={{ padding: '0 14px' }}>Add</button>
                </div>
                {assignmentForm.keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {assignmentForm.keywords.map(kw => (
                      <span key={kw} style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: '999px', padding: '4px 12px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {kw}
                        <button type="button" onClick={() => handleKeywordRemove(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0, fontWeight: 700 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowAssignmentModal(false)} className="class-overview__action-btn" style={{ background: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)' }}>Cancel</button>
                <button type="submit" className="class-overview__action-btn" disabled={savingAssignment}>
                  {savingAssignment ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── EDIT/VIEW ASSIGNMENT DETAIL MODAL ── */}
      {viewingAssignment && createPortal(
        <div 
          onClick={() => setViewingAssignment(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="text-title-lg" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>edit_note</span>
                Edit Assignment
              </h3>
              <button onClick={() => setViewingAssignment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                />
              </div>

              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe assignment..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Due Date *</label>
                  <input
                    type="datetime-local"
                    value={editForm.dueDate}
                    onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 10, border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', fontSize: '0.95rem' }}
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--color-on-surface-variant)' }}>Keywords</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={editForm.keywordsInput}
                    onChange={e => setEditForm(p => ({ ...p, keywordsInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditKeywordAdd() } }}
                    placeholder="Type a keyword and press Enter or Add"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-outline)', fontSize: '0.9rem', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                  />
                  <button type="button" onClick={handleEditKeywordAdd} className="class-overview__action-btn" style={{ padding: '0 14px' }}>Add</button>
                </div>
                {editForm.keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {editForm.keywords.map(kw => (
                      <span key={kw} style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: '999px', padding: '4px 12px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {kw}
                        <button type="button" onClick={() => handleEditKeywordRemove(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0, fontWeight: 700 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" onClick={() => setViewingAssignment(null)} className="class-overview__action-btn" style={{ background: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)' }}>Cancel</button>
                <button type="submit" className="class-overview__action-btn" disabled={savingAssignment}>
                  {savingAssignment ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── CUSTOM CONFIRM DELETE MODAL ── */}
      {deletingAssignment && createPortal(
        <div 
          onClick={() => setDeletingAssignment(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="text-title-lg" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)' }}>
                <span className="material-symbols-outlined">warning</span>
                Delete Assignment
              </h3>
              <button onClick={() => setDeletingAssignment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div>
              <p className="text-body-md" style={{ margin: 0, lineHeight: 1.6, color: 'var(--color-on-surface-variant)' }}>
                Are you sure you want to delete the assignment <strong>"{deletingAssignment.title}"</strong>?
              </p>
              <p className="text-body-sm" style={{ margin: '8px 0 0', color: 'var(--color-outline)', fontWeight: 500 }}>
                This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                type="button" 
                onClick={() => setDeletingAssignment(null)} 
                className="class-overview__action-btn" 
                style={{ background: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteAssignment} 
                className="class-overview__action-btn" 
                style={{ background: 'var(--color-error)', color: 'var(--color-on-error)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
