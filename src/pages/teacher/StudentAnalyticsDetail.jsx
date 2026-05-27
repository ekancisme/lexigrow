import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import './StudentAnalyticsDetail.css'

export default function StudentAnalyticsDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStudentDetail() {
      try {
        const res = await api.get(`/teacher/students/${id}`)
        setData(res.data)
      } catch (err) {
        console.error('Error fetching student details:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStudentDetail()
  }, [id])

  if (loading) {
    return (
      <div className="student-analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="student-analytics" style={{ padding: 24, textAlign: 'center' }}>
        <h3 className="text-title-lg" style={{ color: 'var(--color-error)' }}>Student Data Not Found</h3>
        <button onClick={() => navigate(-1)} className="student-analytics__back" style={{ marginTop: 16 }}>
          Go Back
        </button>
      </div>
    )
  }

  const { student, class: className, metrics, essayHistory } = data

  // Find if we have any pending reviews to link to
  // If not, we can navigate to manual feedback review using essay history ID
  const latestEssay = essayHistory?.[0]

  // Calculate points for the growth SVG trend line
  const maxVal = essayHistory.length > 0 ? Math.max(...essayHistory.map(e => e.ttr)) : 1
  const points = essayHistory.length > 0 ? [...essayHistory].reverse().map((e, index) => {
    const x = (index / Math.max(1, essayHistory.length - 1)) * 800
    const y = 180 - ((e.ttr / maxVal) * 150)
    return `${x},${y}`
  }).join(' ') : ''

  const pathD = points ? `M 0,180 L ${points} L 800,180` : ''
  const lineD = points ? `M ${points}` : 'M 0,180 L 800,180'

  return (
    <div className="student-analytics">
      <button className="student-analytics__back" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined">arrow_back</span> Back
      </button>
      <section className="student-analytics__profile card-base">
        <div className="student-analytics__avatar">
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-primary)' }}>person</span>
        </div>
        <div className="student-analytics__info">
          <h2 className="text-headline-lg">{student?.name}</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {className} • {student?.englishLevel || 'N/A'} Level • Joined {new Date(student?.createdAt).toLocaleDateString()}
          </p>
        </div>
        {latestEssay && (
          <button className="student-analytics__feedback-btn" onClick={() => navigate(`/teacher/feedback/${latestEssay._id}`)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rate_review</span> Write Feedback
          </button>
        )}
      </section>

      <section className="student-analytics__metrics">
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Total Essays</p>
          <p className="text-headline-md">{metrics?.totalEssays || 0}</p>
        </div>
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Vocabulary Size</p>
          <p className="text-headline-md">{metrics?.vocabularySize || 0}</p>
        </div>
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. TTR</p>
          <p className="text-headline-md">{metrics?.avgTTR?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="card-base">
          <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Growth</p>
          <p className="text-headline-md" style={{ color: metrics?.growth?.startsWith('-') ? 'var(--color-error)' : 'var(--color-success)' }}>
            {metrics?.growth || '0%'}
          </p>
        </div>
      </section>

      <section className="student-analytics__chart card-base">
        <h3 className="text-title-lg" style={{ marginBottom: 20 }}>Growth Trend</h3>
        <div style={{ position: 'relative', width: '100%', height: 200 }}>
          <svg viewBox="0 0 800 200" style={{ width: '100%', height: 200 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="saGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005bbf" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#005bbf" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="50" x2="800" y2="50" stroke="#e5eeff" strokeWidth="1"/>
            <line x1="0" y1="100" x2="800" y2="100" stroke="#e5eeff" strokeWidth="1"/>
            <line x1="0" y1="150" x2="800" y2="150" stroke="#e5eeff" strokeWidth="1"/>
            {essayHistory.length > 0 && (
              <>
                <path d={lineD} fill="none" stroke="#005bbf" strokeWidth="3"/>
                <path d={pathD} fill="url(#saGrad)"/>
              </>
            )}
          </svg>
        </div>
      </section>

      <section className="card-base" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-outline-variant)' }}>
          <h3 className="text-title-lg">Essay History</h3>
        </div>
        {essayHistory.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-outline)' }}>
            No essays written yet.
          </div>
        ) : (
          <table className="student-analytics__table">
            <thead>
              <tr>
                <th className="text-label-sm">DATE</th>
                <th className="text-label-sm">TITLE</th>
                <th className="text-label-sm">WORDS</th>
                <th className="text-label-sm">TTR</th>
                <th className="text-label-sm">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {essayHistory.map((e) => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 700 }}>{e.title}</td>
                  <td>{e.words}</td>
                  <td>{e.ttr?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className="student-analytics__score-badge">{e.score}/10</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
