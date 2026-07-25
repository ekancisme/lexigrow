import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './ParentDashboard.css'

const RELATIONSHIPS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
]

export default function ParentDashboard() {
  const { updateUser } = useAuth()
  const [children, setChildren] = useState([])
  const [linkCode, setLinkCode] = useState('')
  const [relationship, setRelationship] = useState('guardian')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadChildren() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/parent/children')
      const linkedChildren = Array.isArray(response.data) ? response.data : []
      setChildren(linkedChildren)
      updateUser({ children: linkedChildren })
    } catch (err) {
      setError(err.message || 'Unable to load linked students.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChildren()
  }, [])

  async function handleLink(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const response = await api.post('/parent/link', { linkCode, relationship })
      setMessage(response.message || 'Student linked successfully.')
      setLinkCode('')
      await loadChildren()
    } catch (err) {
      setError(err.message || 'Unable to link this student.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnlink(child) {
    const confirmed = window.confirm(`Stop monitoring ${child.name}? This only removes this student from your account.`)
    if (!confirmed) return

    setError('')
    setMessage('')
    try {
      await api.delete(`/parent/children/${child._id}/link`)
      const linkedChildren = children.filter(item => item._id !== child._id)
      setChildren(linkedChildren)
      updateUser({ children: linkedChildren })
      setMessage(`${child.name} was unlinked.`)
    } catch (err) {
      setError(err.message || 'Unable to unlink this student.')
    }
  }

  return (
    <div className="parent-dashboard">
      <header className="parent-dashboard__header">
        <div>
          <h2 className="text-headline-lg">Family dashboard</h2>
          <p className="text-body-md">Link each student with their own one-time code.</p>
        </div>
        <span className="parent-dashboard__count">{children.length} linked</span>
      </header>

      {error && <div className="parent-dashboard__notice parent-dashboard__notice--error" role="alert">{error}</div>}
      {message && <div className="parent-dashboard__notice parent-dashboard__notice--success" role="status">{message}</div>}

      <section className="parent-dashboard__link-panel">
        <div>
          <h3 className="text-title-lg">Link another student</h3>
          <p className="text-body-sm">Ask the student to generate a code from Settings. Codes expire after 15 minutes and can only be used once.</p>
        </div>
        <form className="parent-dashboard__link-form" onSubmit={handleLink}>
          <label>
            <span>One-time code</span>
            <input
              value={linkCode}
              onChange={event => setLinkCode(event.target.value.toUpperCase())}
              placeholder="ABCD2345"
              maxLength={10}
              autoComplete="off"
              required
            />
          </label>
          <label>
            <span>Relationship</span>
            <select value={relationship} onChange={event => setRelationship(event.target.value)}>
              {RELATIONSHIPS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={submitting || linkCode.trim().length < 8}>
            <span className="material-symbols-outlined">link</span>
            {submitting ? 'Linking...' : 'Link student'}
          </button>
        </form>
      </section>

      <section className="parent-dashboard__students" aria-busy={loading}>
        <div className="parent-dashboard__section-heading">
          <h3 className="text-title-lg">Linked students</h3>
          {!loading && children.length > 0 && <button type="button" onClick={loadChildren}>Refresh</button>}
        </div>

        {loading ? (
          <div className="parent-dashboard__empty">Loading linked students...</div>
        ) : children.length === 0 ? (
          <div className="parent-dashboard__empty">
            <span className="material-symbols-outlined">family_restroom</span>
            <strong>No students linked yet</strong>
            <p>Use a one-time code above to add your first student.</p>
          </div>
        ) : (
          <div className="parent-dashboard__student-grid">
            {children.map(child => (
              <article className="parent-dashboard__student" key={child._id}>
                <div className="parent-dashboard__avatar" aria-hidden="true">
                  {child.avatar ? <img src={child.avatar} alt="" /> : <span className="material-symbols-outlined">school</span>}
                </div>
                <div>
                  <h4>{child.name}</h4>
                  <p>{child.email}</p>
                  <span>{child.englishLevel || 'Level not set'}</span>
                </div>
                <button type="button" className="parent-dashboard__unlink" onClick={() => handleUnlink(child)} title={`Unlink ${child.name}`}>
                  <span className="material-symbols-outlined">link_off</span>
                  <span>Unlink</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}