import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './ClassManagement.css'

export default function ClassManagement() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schedule, setSchedule] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadClasses() {
    try {
      const res = await api.get('/classes')
      setClasses(res.data || [])
    } catch (err) {
      console.error('Error fetching classes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  async function handleCreateClass(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await api.post('/classes', {
        name,
        description,
        schedule,
      })
      setName('')
      setDescription('')
      setSchedule('')
      setShowModal(false)
      loadClasses()
    } catch (err) {
      alert('Error creating class: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="class-mgmt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="class-mgmt">
      <section className="class-mgmt__header">
        <div>
          <h2 className="text-headline-lg">Class Management</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Create, edit, and manage your classes and student rosters</p>
        </div>
        <button className="class-mgmt__create-btn" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">add</span> Create New Class
        </button>
      </section>

      <div className="class-mgmt__grid">
        {classes.length === 0 ? (
          <div className="card-base" style={{ padding: 32, gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-outline)' }}>
            No classes created yet. Click "Create New Class" to get started.
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls._id} className="class-mgmt__card card-base">
              <div className="class-mgmt__card-header">
                <h3 className="text-title-lg">{cls.name}</h3>
                <span className={`class-mgmt__badge class-mgmt__badge--${cls.status || 'active'}`}>{cls.status || 'active'}</span>
              </div>
              <div className="class-mgmt__card-details">
                <div className="class-mgmt__detail">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>group</span>
                  <span className="text-label-md">{(cls.students || []).length} Students</span>
                </div>
                <div className="class-mgmt__detail">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>schedule</span>
                  <span className="text-label-md">{cls.schedule || 'No schedule'}</span>
                </div>
              </div>
              <div className="class-mgmt__card-actions">
                <button className="class-mgmt__view-btn" onClick={() => navigate(`/teacher/class/${cls._id}`)}>View Roster</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="class-mgmt__modal-overlay" onClick={() => setShowModal(false)}>
          <form className="class-mgmt__modal card-base" onClick={e => e.stopPropagation()} onSubmit={handleCreateClass}>
            <h3 className="text-headline-md" style={{ marginBottom: 20 }}>Create New Class</h3>
            <div className="class-mgmt__form-field">
              <label className="text-label-md">Class Name</label>
              <input
                type="text"
                placeholder="e.g., English 201"
                className="class-mgmt__input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="class-mgmt__form-field">
              <label className="text-label-md">Description</label>
              <textarea
                placeholder="Brief description..."
                className="class-mgmt__textarea"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="class-mgmt__form-field">
              <label className="text-label-md">Schedule</label>
              <input
                type="text"
                placeholder="e.g., Mon, Wed, Fri"
                className="class-mgmt__input"
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="class-mgmt__cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="class-mgmt__submit-btn" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
