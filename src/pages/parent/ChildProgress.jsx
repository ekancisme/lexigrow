import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import VocabularyTab from '../../components/common/VocabularyTab.jsx'
import './ChildProgress.css'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'monitoring' },
  { id: 'essays', label: 'Essays', icon: 'history_edu' },
  { id: 'vocabulary', label: 'Vocabulary', icon: 'menu_book' },
  { id: 'alerts', label: 'Alerts', icon: 'warning' },
]

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function GrowthChart({ weeks = [] }) {
  const maxCount = Math.max(1, ...weeks.map(week => week.count || 0))

  return (
    <div className="child-progress__growth" aria-label="Vocabulary added during the last six weeks">
      {weeks.map(week => {
        const height = week.count > 0 ? Math.max(12, (week.count / maxCount) * 100) : 3
        return (
          <div className="child-progress__growth-column" key={week.start}>
            <span className="child-progress__growth-value">{week.count}</span>
            <div className="child-progress__growth-track">
              <div className="child-progress__growth-bar" style={{ height: `${height}%` }} />
            </div>
            <span className="child-progress__growth-label">{new Date(week.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
          </div>
        )
      })}
    </div>
  )
}

function Overview({ progress }) {
  return (
    <div className="child-progress__overview">
      <section className="child-progress__metrics" aria-label="Progress summary">
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">dictionary</span>
          <strong>{progress.totalVocab}</strong>
          <small>Total vocabulary</small>
        </div>
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">description</span>
          <strong>{progress.totalEssays}</strong>
          <small>Essays written</small>
        </div>
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">analytics</span>
          <strong>{Number(progress.avgTTR || 0).toFixed(2)}</strong>
          <small>Average diversity</small>
        </div>
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">translate</span>
          <strong>{progress.englishLevel || 'N/A'}</strong>
          <small>Current level</small>
        </div>
      </section>

      <section className="child-progress__section">
        <div className="child-progress__section-heading">
          <div>
            <h3>Vocabulary growth</h3>
            <p>New words added in each seven-day period.</p>
          </div>
          <span>Last 6 weeks</span>
        </div>
        <GrowthChart weeks={progress.weeklyVocabulary} />
      </section>
    </div>
  )
}

function EssayList({ essays }) {
  if (essays.length === 0) {
    return <div className="child-progress__empty"><span className="material-symbols-outlined">history_edu</span><strong>No essays yet</strong><p>Submitted essays will appear here.</p></div>
  }

  return (
    <div className="child-progress__timeline">
      {essays.map(essay => (
        <article className="child-progress__essay" key={essay._id}>
          <div className="child-progress__essay-date"><span>{formatDate(essay.submittedAt || essay.createdAt)}</span></div>
          <div className="child-progress__essay-body">
            <div>
              <h3>{essay.title}</h3>
              <p>{essay.theme || 'General'} · {essay.wordCount || 0} words</p>
            </div>
            <div className="child-progress__essay-meta">
              <span className={`child-progress__status child-progress__status--${essay.status}`}>{essay.status.replace('_', ' ')}</span>
              <strong>{essay.analysis ? `${Number(essay.analysis.overallScore || 0).toFixed(1)}/10` : 'Not scored'}</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function AlertList({ alerts }) {
  if (alerts.length === 0) {
    return <div className="child-progress__empty"><span className="material-symbols-outlined">verified</span><strong>No active concerns</strong><p>Learning alerts and their resolution status will appear here.</p></div>
  }

  return (
    <div className="child-progress__alerts">
      {alerts.map(alert => (
        <article className={`child-progress__alert child-progress__alert--${alert.type}`} key={alert._id}>
          <span className="material-symbols-outlined">{alert.type === 'critical' ? 'error' : 'warning'}</span>
          <div>
            <div className="child-progress__alert-heading">
              <h3>{alert.metric.replaceAll('_', ' ')}</h3>
              <span>{alert.isResolved ? 'Resolved' : 'Needs attention'}</span>
            </div>
            <p>{alert.detail}</p>
            <small>{formatDate(alert.createdAt)}</small>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function ChildProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [children, setChildren] = useState([])
  const [progress, setProgress] = useState(null)
  const [essays, setEssays] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadChildData() {
      setLoading(true)
      setError('')
      try {
        const childrenResponse = await api.get('/parent/children')
        const linkedChildren = Array.isArray(childrenResponse.data) ? childrenResponse.data : []
        if (!linkedChildren.some(child => child._id === id)) {
          throw new Error('This student is not linked to your account.')
        }

        const [progressResponse, essaysResponse, alertsResponse] = await Promise.all([
          api.get(`/parent/children/${id}/progress`),
          api.get(`/parent/children/${id}/essays`),
          api.get(`/parent/children/${id}/alerts`),
        ])

        if (!active) return
        setChildren(linkedChildren)
        setProgress(progressResponse.data)
        setEssays(Array.isArray(essaysResponse.data) ? essaysResponse.data : [])
        setAlerts(Array.isArray(alertsResponse.data) ? alertsResponse.data : [])
      } catch (err) {
        if (active) setError(err.message || 'Unable to load student progress.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadChildData()
    return () => { active = false }
  }, [id])

  if (loading) {
    return <div className="child-progress__state"><span className="material-symbols-outlined animate-spin">progress_activity</span><p>Loading student progress...</p></div>
  }

  if (error || !progress) {
    return <div className="child-progress__state child-progress__state--error"><span className="material-symbols-outlined">error_outline</span><h2>Progress unavailable</h2><p>{error}</p><button onClick={() => navigate('/parent/dashboard')}>Back to dashboard</button></div>
  }

  return (
    <div className="child-progress">
      <header className="child-progress__header">
        <button className="child-progress__back" onClick={() => navigate('/parent/dashboard')} aria-label="Back to family dashboard">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="child-progress__identity">
          <div className="child-progress__avatar">{progress.avatar ? <img src={progress.avatar} alt="" /> : <span className="material-symbols-outlined">school</span>}</div>
          <div>
            <h2>{progress.name}</h2>
            <p>{progress.email}</p>
          </div>
        </div>
        <label className="child-progress__selector">
          <span>Viewing student</span>
          <select value={id} onChange={event => navigate(`/parent/children/${event.target.value}`)}>
            {children.map(child => <option key={child._id} value={child._id}>{child.name}</option>)}
          </select>
        </label>
      </header>

      <nav className="child-progress__tabs" aria-label="Student progress views">
        {TABS.map(tab => (
          <button key={tab.id} className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}>
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
            {tab.id === 'alerts' && alerts.some(alert => !alert.isResolved) && <i aria-label="Unresolved alerts" />}
          </button>
        ))}
      </nav>

      <main className="child-progress__content">
        {activeTab === 'overview' && <Overview progress={progress} />}
        {activeTab === 'essays' && <EssayList essays={essays} />}
        {activeTab === 'vocabulary' && <VocabularyTab apiBase={`/parent/children/${id}/vocabulary`} />}
        {activeTab === 'alerts' && <AlertList alerts={alerts} />}
      </main>
    </div>
  )
}