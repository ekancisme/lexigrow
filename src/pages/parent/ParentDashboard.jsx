import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { updateUser, selectParentChild } = useAuth()
  const { t } = useLanguage()
  const [children, setChildren] = useState([])
  const [linkCode, setLinkCode] = useState('')
  const [relationship, setRelationship] = useState('guardian')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const linkModalOpen = searchParams.get('link') === '1'

  function openLinkModal() {
    setSearchParams({ link: '1' })
  }

  function closeLinkModal() {
    setSearchParams({})
    setError('')
    setLinkCode('')
  }

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
    let active = true

    api.get('/parent/children')
      .then(response => {
        if (!active) return
        const linkedChildren = Array.isArray(response.data) ? response.data : []
        setChildren(linkedChildren)
        updateUser({ children: linkedChildren })
      })
      .catch(err => {
        if (active) setError(err.message || 'Unable to load linked students.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [updateUser])

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
      closeLinkModal()
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

  function openChildView(childId, view) {
    selectParentChild(childId)
    navigate(`/parent/children/${childId}/${view}`)
  }

  const attentionChildren = children.filter(child => (child.unreadAlertCount || 0) > 0)
  const totalAlerts = children.reduce((sum, child) => sum + (child.activeAlertCount || 0), 0)
  const totalWordsThisWeek = children.reduce((sum, child) => sum + (child.wordsThisWeek || 0), 0)
  const averageGoalCompletion = children.length > 0
    ? Math.round(children.reduce((sum, child) => sum + (child.goalCompletionRate || 0), 0) / children.length)
    : 0

  return (
    <div className="parent-dashboard">
      <header className="parent-dashboard__header">
        <div>
          <p className="parent-dashboard__eyebrow">{t('header.parentWorkspace', 'Parent workspace')}</p>
          <h2 className="text-headline-lg">{t('parent.dashboardTitle', 'Family overview')}</h2>
          <p className="text-body-md">{t('parent.dashboardSubtitle', 'See what changed this week and where your support matters most.')}</p>
        </div>
        <button type="button" className="parent-dashboard__link-button" onClick={openLinkModal}>
          <span className="material-symbols-outlined">person_add</span>
          {t('nav.linkStudent', 'Link student')}
        </button>
      </header>

      {error && <div className="parent-dashboard__notice parent-dashboard__notice--error" role="alert">{error}</div>}
      {message && <div className="parent-dashboard__notice parent-dashboard__notice--success" role="status">{message}</div>}

      {!loading && children.length > 0 && (
        <section className="parent-dashboard__family-stats" aria-label="Family learning summary">
          <div><span>{t('parent.linkedChildren', 'Linked students')}</span><strong>{children.length}</strong></div>
          <div><span>{t('parent.weeklyActivity', 'New words this week')}</span><strong>{totalWordsThisWeek}</strong></div>
          <div><span>{t('nav.weeklyGoals', 'Weekly goals')}</span><strong>{averageGoalCompletion}%</strong></div>
          <div className={totalAlerts > 0 ? 'is-alert' : ''}><span>{t('nav.alerts', 'Open alerts')}</span><strong>{totalAlerts}</strong></div>
        </section>
      )}

      {!loading && attentionChildren.length > 0 && (
        <section className="parent-dashboard__attention">
          <div className="parent-dashboard__attention-heading">
            <span className="material-symbols-outlined">notifications_active</span>
            <div>
              <h3>{t('teacher.interventionNeeded', 'Needs your attention')}</h3>
              <p>Review recent changes before they become longer-term learning gaps.</p>
            </div>
          </div>
          <div className="parent-dashboard__attention-list">
            {attentionChildren.map(child => (
              <button key={child._id} onClick={() => openChildView(child._id, 'alerts')}>
                <span className={`parent-dashboard__status-dot parent-dashboard__status-dot--${child.overallStatus}`} />
                <span><strong>{child.name}</strong>{` has ${child.unreadAlertCount} new alert${child.unreadAlertCount === 1 ? '' : 's'} to review`}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="parent-dashboard__students" aria-busy={loading}>
        <div className="parent-dashboard__section-heading">
          <div>
            <h3 className="text-title-lg">{t('parent.linkedChildren', 'Your students')}</h3>
            <p>{t('header.familyOverview', 'Weekly progress at a glance')}</p>
          </div>
          {!loading && children.length > 0 && <button type="button" onClick={loadChildren} aria-label="Refresh family overview"><span className="material-symbols-outlined">refresh</span></button>}
        </div>

        {loading ? (
          <div className="parent-dashboard__skeleton-grid" aria-label="Loading student summaries">
            {[1, 2].map(item => <div className="parent-dashboard__skeleton shimmer" key={item} />)}
          </div>
        ) : children.length === 0 ? (
          <div className="parent-dashboard__empty">
            <span className="material-symbols-outlined">family_restroom</span>
            <strong>{t('parent.noLinkedChildren', 'No students linked yet')}</strong>
            <p>Link a student with their one-time code to start following learning progress.</p>
            <button type="button" onClick={openLinkModal}>{t('nav.linkStudent', 'Link your first student')}</button>
          </div>
        ) : (
          <div className="parent-dashboard__student-grid">
            {children.map(child => (
              <article className="parent-dashboard__student" key={child._id}>
                <div className="parent-dashboard__student-header">
                  <div className="parent-dashboard__avatar" aria-hidden="true">
                    {child.avatar ? <img src={child.avatar} alt="" /> : <span className="material-symbols-outlined">school</span>}
                  </div>
                  <div className="parent-dashboard__student-identity">
                    <h4>{child.name}</h4>
                    <p>{child.className || 'No active class'}{child.teacherName ? ` · ${child.teacherName}` : ''}</p>
                  </div>
                  <span className={`parent-dashboard__status parent-dashboard__status--${child.overallStatus || 'on_track'}`}>
                    <span className="material-symbols-outlined">check_circle</span>
                    {t('teacher.lowRisk', 'On track')}
                  </span>
                </div>
                <div className="parent-dashboard__student-metrics">
                  <div>
                    <span>{t('feedback.overallBand', 'Latest score')}</span>
                    <strong>{child.latestScore !== null && child.latestScore !== undefined ? child.latestScore.toFixed(1) : '—'}</strong>
                    <small className={(child.scoreChange || 0) >= 0 ? 'is-positive' : 'is-negative'}>{child.scoreChange === null || child.scoreChange === undefined ? 'No comparison yet' : `${child.scoreChange >= 0 ? '+' : ''}${child.scoreChange} vs previous`}</small>
                  </div>
                  <div>
                    <span>{t('parent.wordsMastered', 'New words')}</span>
                    <strong>{child.wordsThisWeek || 0}</strong>
                    <small className={(child.wordsChange || 0) >= 0 ? 'is-positive' : 'is-negative'}>{`${(child.wordsChange || 0) >= 0 ? '+' : ''}${child.wordsChange || 0} vs last week`}</small>
                  </div>
                  <div>
                    <span>{t('nav.weeklyGoals', 'Weekly goals')}</span>
                    <strong>{child.goalsConfigured ? `${child.goalCompletionRate || 0}%` : '—'}</strong>
                    <small>{child.goalsConfigured ? 'Current completion' : 'Not configured'}</small>
                  </div>
                </div>
                <div className="parent-dashboard__goal-track" aria-label={`${child.name} weekly goal completion`}>
                  <span style={{ width: `${child.goalsConfigured ? child.goalCompletionRate || 0 : 0}%` }} />
                </div>
                <div className="parent-dashboard__student-activity">
                  <span className="material-symbols-outlined">history</span>
                  <div><strong>{child.latestEssay?.title || t('dashboard.noEssays', 'No essays submitted yet')}</strong></div>
                  <span className="parent-dashboard__level">{child.englishLevel || 'N/A'}</span>
                </div>
                <div className="parent-dashboard__student-actions">
                  <button type="button" className="parent-dashboard__view" onClick={() => openChildView(child._id, 'progress')}>
                    <span className="material-symbols-outlined">monitoring</span>
                    <span>{t('parent.viewChildDetail', 'View progress')}</span>
                  </button>
                  <button type="button" onClick={() => openChildView(child._id, 'essays')}><span className="material-symbols-outlined">history_edu</span><span>{t('nav.essays', 'Essays')}</span></button>
                  <details className="parent-dashboard__more">
                    <summary aria-label={`More actions for ${child.name}`}><span className="material-symbols-outlined">more_vert</span></summary>
                    <button type="button" className="parent-dashboard__unlink" onClick={() => handleUnlink(child)}><span className="material-symbols-outlined">link_off</span>Unlink student</button>
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {linkModalOpen && (
        <div className="parent-dashboard__modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeLinkModal() }}>
          <section className="parent-dashboard__modal" role="dialog" aria-modal="true" aria-labelledby="link-student-title">
            <div className="parent-dashboard__modal-header">
              <div><p>Family access</p><h3 id="link-student-title">{t('nav.linkStudent', 'Link a student')}</h3></div>
              <button type="button" onClick={closeLinkModal} aria-label="Close link student dialog"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="parent-dashboard__modal-copy">Ask the student to generate a one-time code from Settings. The code expires after 15 minutes and can only be used once.</p>
            <form className="parent-dashboard__link-form" onSubmit={handleLink}>
              <label><span>One-time code</span><input value={linkCode} onChange={event => setLinkCode(event.target.value.toUpperCase())} placeholder="ABCD2345" maxLength={10} autoComplete="off" autoFocus required /></label>
              <label><span>Your relationship</span><select value={relationship} onChange={event => setRelationship(event.target.value)}>{RELATIONSHIPS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <div className="parent-dashboard__modal-actions"><button type="button" onClick={closeLinkModal}>{t('common.cancel', 'Cancel')}</button><button type="submit" disabled={submitting || linkCode.trim().length < 8}>{submitting ? 'Linking...' : t('nav.linkStudent', 'Link student')}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}