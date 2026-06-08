import { useState, useEffect } from 'react'
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

  useEffect(() => {
    loadClassDetail()
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
    e.stopPropagation() // Don't trigger row click navigation
    if (!window.confirm('Are you sure you want to remove this student?')) return
    try {
      await api.delete(`/classes/${id}/students/${studentId}`)
      loadClassDetail()
    } catch (err) {
      alert('Error removing student: ' + err.message)
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

      {/* Roster Section */}
      <section className="card-base" style={{ padding: 0 }}>
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
    </div>
  )
}
