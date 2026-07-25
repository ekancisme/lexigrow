import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import VocabularyTab from '../../components/common/VocabularyTab.jsx'
import './ChildProgress.css'

const TABS = [
  { id: 'progress', label: 'Progress', icon: 'monitoring' },
  { id: 'essays', label: 'Essays', icon: 'history_edu' },
  { id: 'vocabulary', label: 'Vocabulary', icon: 'menu_book' },
  { id: 'goals', label: 'Weekly goals', icon: 'flag' },
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

function Overview({ progress, essays, alerts, goals, onNavigate }) {
  const weeks = progress.weeklyVocabulary || []
  const wordsThisWeek = weeks.at(-1)?.count || 0
  const wordsLastWeek = weeks.at(-2)?.count || 0
  const wordsChange = wordsThisWeek - wordsLastWeek
  const scoredEssays = essays.filter(essay => essay.analysis).slice(0, 2)
  const latestScore = scoredEssays[0]?.analysis?.overallScore
  const scoreChange = scoredEssays.length > 1
    ? Math.round((scoredEssays[0].analysis.overallScore - scoredEssays[1].analysis.overallScore) * 10) / 10
    : null
  const openAlerts = alerts.filter(alert => !alert.isResolved)
  const insight = openAlerts.length > 0
    ? `${openAlerts.length} learning signal${openAlerts.length === 1 ? '' : 's'} need attention. Start with ${openAlerts[0].metric.replaceAll('_', ' ')}.`
    : wordsThisWeek === 0
      ? 'No new vocabulary was recorded this week. A short review session can help restore momentum.'
      : wordsChange > 0
        ? `${progress.name} added ${wordsThisWeek} words this week, ${wordsChange} more than last week.`
        : `${progress.name} is active and has no unresolved learning alerts.`

  return (
    <div className="child-progress__overview">
      <section className={`child-progress__insight ${openAlerts.length > 0 || wordsThisWeek === 0 ? 'child-progress__insight--attention' : ''}`}>
        <span className="material-symbols-outlined">{openAlerts.length > 0 ? 'priority_high' : wordsThisWeek === 0 ? 'lightbulb' : 'trending_up'}</span>
        <div><p>This week at a glance</p><h3>{insight}</h3></div>
        <button onClick={() => onNavigate(openAlerts.length > 0 ? 'alerts' : 'goals')}>{openAlerts.length > 0 ? 'Review alerts' : 'View weekly goals'}<span className="material-symbols-outlined">arrow_forward</span></button>
      </section>

      <section className="child-progress__metrics" aria-label="Progress summary">
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">dictionary</span>
          <strong>{progress.totalVocab}</strong>
          <small>{wordsThisWeek} new this week</small>
        </div>
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">description</span>
          <strong>{progress.totalEssays}</strong>
          <small>{essays[0] ? `Latest ${formatDate(essays[0].submittedAt || essays[0].createdAt)}` : 'No submissions yet'}</small>
        </div>
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">analytics</span>
          <strong>{Number(progress.avgTTR || 0).toFixed(2)}</strong>
          <small>{progress.avgTTR >= 0.6 ? 'Healthy vocabulary range' : 'Developing vocabulary range'}</small>
        </div>
        <div className="child-progress__metric">
          <span className="material-symbols-outlined">translate</span>
          <strong>{progress.englishLevel || 'N/A'}</strong>
          <small>Current level</small>
        </div>
      </section>

      <div className="child-progress__overview-grid">
        <section className="child-progress__section child-progress__section--growth">
          <div className="child-progress__section-heading">
            <div>
              <h3>Vocabulary growth</h3>
              <p>New words added in each seven-day period.</p>
            </div>
            <span className={wordsChange >= 0 ? 'is-positive' : 'is-negative'}>{`${wordsChange >= 0 ? '+' : ''}${wordsChange} vs last week`}</span>
          </div>
          <GrowthChart weeks={weeks} />
        </section>

        <aside className="child-progress__side-stack">
          <section className="child-progress__section child-progress__goal-preview">
            <div className="child-progress__section-heading"><div><h3>Weekly goals</h3><p>{goals?.configured ? `${goals.completionRate}% complete` : 'No goals configured'}</p></div><button onClick={() => onNavigate('goals')}>View all</button></div>
            <div className="child-progress__goal-ring" style={{ '--goal-progress': `${goals?.completionRate || 0}%` }}><strong>{goals?.completionRate || 0}%</strong></div>
            {goals?.goals?.slice(0, 2).map(goal => <div className="child-progress__mini-goal" key={goal.label}><span>{goal.label}</span><strong>{goal.current}/{goal.target}</strong></div>)}
          </section>
          <section className="child-progress__section child-progress__latest-score">
            <div><span>Latest essay score</span><strong>{latestScore !== undefined ? `${Number(latestScore).toFixed(1)}/10` : 'Not scored'}</strong></div>
            <small className={(scoreChange || 0) >= 0 ? 'is-positive' : 'is-negative'}>{scoreChange === null ? 'A comparison will appear after two scored essays' : `${scoreChange >= 0 ? '+' : ''}${scoreChange} compared with the previous essay`}</small>
            <button onClick={() => onNavigate('essays')}>Open essay history</button>
          </section>
        </aside>
      </div>

      <section className="child-progress__recent">
        <div className="child-progress__section-heading"><div><h3>Recent activity</h3><p>Latest submissions and feedback status</p></div><button onClick={() => onNavigate('essays')}>View all essays</button></div>
        {essays.slice(0, 3).map(essay => <button key={essay._id} onClick={() => onNavigate('essays')}><span className="material-symbols-outlined">description</span><span><strong>{essay.title}</strong><small>{formatDate(essay.submittedAt || essay.createdAt)} · {essay.status.replaceAll('_', ' ')}</small></span><strong>{essay.analysis ? `${Number(essay.analysis.overallScore).toFixed(1)}/10` : 'Pending'}</strong></button>)}
        {essays.length === 0 && <p className="child-progress__recent-empty">No essay activity yet.</p>}
      </section>
    </div>
  )
}

function EssayList({ essays, expandedEssayId, onToggle }) {
  if (essays.length === 0) {
    return <div className="child-progress__empty"><span className="material-symbols-outlined">history_edu</span><strong>No essays yet</strong><p>Submitted essays will appear here.</p></div>
  }

  return (
    <div className="child-progress__timeline">
      {essays.map(essay => (
        <article className={`child-progress__essay ${expandedEssayId === essay._id ? 'is-expanded' : ''}`} key={essay._id}>
          <div className="child-progress__essay-date"><span>{formatDate(essay.submittedAt || essay.createdAt)}</span></div>
          <div className="child-progress__essay-body">
            <div>
              <h3>{essay.title}</h3>
              <p>{essay.theme || 'General'} · {essay.wordCount || 0} words</p>
            </div>
            <div className="child-progress__essay-meta">
              <span className={`child-progress__status child-progress__status--${essay.status}`}>{essay.status.replace('_', ' ')}</span>
              <strong>{essay.analysis ? `${Number(essay.analysis.overallScore || 0).toFixed(1)}/10` : 'Not scored'}</strong>
              <button onClick={() => onToggle(essay._id)} aria-expanded={expandedEssayId === essay._id} aria-label={`${expandedEssayId === essay._id ? 'Hide' : 'Show'} details for ${essay.title}`}><span className="material-symbols-outlined">{expandedEssayId === essay._id ? 'expand_less' : 'expand_more'}</span></button>
            </div>
          </div>
          {expandedEssayId === essay._id && (
            <div className="child-progress__essay-details">
              <div><span>Grammar</span><strong>{essay.analysis ? `${Number(essay.analysis.scores?.grammarAccuracy || 0).toFixed(1)}/10` : 'Pending'}</strong></div>
              <div><span>Vocabulary diversity</span><strong>{essay.analysis ? Number(essay.analysis.scores?.vocabularyDiversity || 0).toFixed(2) : 'Pending'}</strong></div>
              <div><span>Learning status</span><strong>{essay.analysis?.learningPatterns?.learningStatus?.replaceAll('_', ' ') || 'Not available'}</strong></div>
              {essay.analysis?.learningPatterns?.feedback && <p>{essay.analysis.learningPatterns.feedback}</p>}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function AlertList({ alerts, onNavigate, onMarkViewed, markingAlertId }) {
  if (alerts.length === 0) {
    return <div className="child-progress__empty"><span className="material-symbols-outlined">verified</span><strong>No active concerns</strong><p>Learning alerts and their resolution status will appear here.</p></div>
  }

  return (
    <div className="child-progress__alerts">
      {alerts.map(alert => (
        <article className={`child-progress__alert child-progress__alert--${alert.type} ${!alert.isViewed ? 'is-unread' : ''}`} key={alert._id}>
          <span className="child-progress__alert-icon"><span className="material-symbols-outlined">{alert.type === 'critical' ? 'error' : 'warning'}</span></span>
          <div>
            <div className="child-progress__alert-heading">
              <h3>{alert.metric.replaceAll('_', ' ')}</h3>
              <div>{!alert.isViewed && <span className="child-progress__new-label">New</span>}<span>{alert.isResolved ? 'Resolved' : 'Needs attention'}</span></div>
            </div>
            <p>{alert.detail}</p>
            <small>{formatDate(alert.createdAt)}</small>
            <div className="child-progress__alert-actions">
              {!alert.isViewed && <button className="child-progress__mark-viewed" onClick={() => onMarkViewed(alert)} disabled={markingAlertId === alert._id}><span className="material-symbols-outlined">done</span>{markingAlertId === alert._id ? 'Saving...' : 'Mark as viewed'}</button>}
              {!alert.isResolved && <><button onClick={() => onNavigate('essays')}>Review essays</button><button onClick={() => onNavigate('vocabulary')}>Review vocabulary</button></>}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function GoalList({ goals }) {
  if (!goals?.configured) {
    return <div className="child-progress__empty"><span className="material-symbols-outlined">flag</span><strong>No weekly goals yet</strong><p>Goals set by the student or teacher will appear here.</p></div>
  }

  return (
    <div className="child-progress__goals">
      <header><div><p>Current week</p><h3>{formatDate(goals.weekStart)} – {formatDate(goals.weekEnd)}</h3></div><strong>{goals.completionRate}% complete</strong></header>
      <div className="child-progress__goal-list">
        {goals.goals.map(goal => {
          const percentage = goal.target > 0 ? Math.min(100, Math.round(goal.current / goal.target * 100)) : 0
          return <article key={goal.label}><span className="material-symbols-outlined">{goal.icon || 'flag'}</span><div><div><h4>{goal.label}</h4><strong>{goal.current} / {goal.target}</strong></div><div className="child-progress__goal-bar"><span style={{ width: `${percentage}%` }} /></div><small>{percentage}% complete</small></div></article>
        })}
      </div>
    </div>
  )
}

export default function ChildProgress({ view = 'progress' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateUser, selectParentChild } = useAuth()
  const [children, setChildren] = useState([])
  const [progress, setProgress] = useState(null)
  const [essays, setEssays] = useState([])
  const [alerts, setAlerts] = useState([])
  const [goals, setGoals] = useState(null)
  const [expandedEssayId, setExpandedEssayId] = useState(null)
  const [markingAlertId, setMarkingAlertId] = useState(null)
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
        selectParentChild(id)

        const [progressResponse, essaysResponse, alertsResponse, goalsResponse] = await Promise.all([
          api.get(`/parent/children/${id}/progress`),
          api.get(`/parent/children/${id}/essays`),
          api.get(`/parent/children/${id}/alerts`),
          api.get(`/parent/children/${id}/goals`),
        ])

        if (!active) return
        setChildren(linkedChildren)
        setProgress(progressResponse.data)
        setEssays(Array.isArray(essaysResponse.data) ? essaysResponse.data : [])
        setAlerts(Array.isArray(alertsResponse.data) ? alertsResponse.data : [])
        setGoals(goalsResponse.data || null)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load student progress.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadChildData()
    return () => { active = false }
  }, [id, selectParentChild])

  function navigateToView(nextView) {
    selectParentChild(id)
    navigate(`/parent/children/${id}/${nextView}`)
  }

  async function handleMarkAlertViewed(alert) {
    setMarkingAlertId(alert._id)
    setError('')
    try {
      await api.patch(`/parent/children/${id}/alerts/${alert._id}/viewed`)
      setAlerts(current => current.map(item => item._id === alert._id ? { ...item, isViewed: true } : item))
      updateUser({
        children: children.map(child => child._id === id
          ? { ...child, unreadAlertCount: Math.max(0, (child.unreadAlertCount || 0) - 1) }
          : child),
      })
    } catch (err) {
      setError(err.message || 'Unable to mark this alert as viewed.')
    } finally {
      setMarkingAlertId(null)
    }
  }

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
          <select value={id} onChange={event => {
            selectParentChild(event.target.value)
            navigate(`/parent/children/${event.target.value}/${view}`)
          }}>
            {children.map(child => <option key={child._id} value={child._id}>{child.name}</option>)}
          </select>
        </label>
      </header>

      <nav className="child-progress__tabs" aria-label="Student progress views">
        {TABS.map(tab => (
          <button key={tab.id} className={view === tab.id ? 'is-active' : ''} onClick={() => navigateToView(tab.id)}>
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
            {tab.id === 'alerts' && alerts.some(alert => !alert.isResolved) && <i aria-label="Unresolved alerts" />}
          </button>
        ))}
      </nav>

      <main className="child-progress__content">
        {view === 'progress' && <Overview progress={progress} essays={essays} alerts={alerts} goals={goals} onNavigate={navigateToView} />}
        {view === 'essays' && <EssayList essays={essays} expandedEssayId={expandedEssayId} onToggle={essayId => setExpandedEssayId(current => current === essayId ? null : essayId)} />}
        {view === 'vocabulary' && <VocabularyTab apiBase={`/parent/children/${id}/vocabulary`} />}
        {view === 'goals' && <GoalList goals={goals} />}
        {view === 'alerts' && <AlertList alerts={alerts} onNavigate={navigateToView} onMarkViewed={handleMarkAlertViewed} markingAlertId={markingAlertId} />}
      </main>
    </div>
  )
}