import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { formatRelativeTime as fmtRelTime } from '../../utils/formatters.js'
import './EarlyWarningAlerts.css'

/* ─── Helpers ────────────────────────────────────────── */
function getAlertMeta(type, t) {
  switch (type) {
    case 'critical': return { icon: 'warning', label: t('earlyWarning.filterCritical'), cls: 'critical' }
    case 'warning': return { icon: 'assignment_late', label: t('earlyWarning.filterWarning'), cls: 'warning' }
    case 'info': return { icon: 'info', label: t('earlyWarning.filterInfo'), cls: 'info' }
    case 'success': return { icon: 'check_circle', label: t('earlyWarning.resolved'), cls: 'success' }
    default: return { icon: 'notifications', label: type || 'Alert', cls: 'info' }
  }
}

function metricLabel(metric, t) {
  if (!metric) return null
  const map = {
    vocabulary_stagnation: t('earlyWarning.metricVocabStagnation'),
    grammar_decline: t('earlyWarning.metricGrammarDecline'),
    overall_score_decline: t('earlyWarning.metricOverallDecline'),
    missed_assignment_deadline: t('earlyWarning.metricMissedDeadline'),
  }
  return map[metric] || metric.replace(/_/g, ' ')
}

const PAGE_SIZE = 15

/* ─── Loading Skeleton ────────────────────────────────── */
function AlertSkeleton() {
  return (
    <div className="ewa-skeleton card-base">
      <div className="ewa-skeleton__header">
        <div className="ewa-skeleton__avatar shimmer" />
        <div className="ewa-skeleton__lines">
          <div className="ewa-skeleton__line ewa-skeleton__line--wide shimmer" />
          <div className="ewa-skeleton__line ewa-skeleton__line--narrow shimmer" />
        </div>
        <div className="ewa-skeleton__badge shimmer" />
      </div>
      <div className="ewa-skeleton__body shimmer" />
      <div className="ewa-skeleton__footer">
        <div className="ewa-skeleton__btn shimmer" />
        <div className="ewa-skeleton__btn shimmer" />
      </div>
    </div>
  )
}

/* ─── Alert Card ──────────────────────────────────────── */
function AlertCard({ alert, onResolve, resolving, t, language }) {
  const navigate = useNavigate()
  const meta = getAlertMeta(alert.type, t)
  const studentId = alert.student?._id

  return (
    <div
      className={`ewa-card card-base ewa-card--${meta.cls} ${alert.isResolved ? 'ewa-card--resolved' : ''} animate-fade-in`}
      role="article"
      aria-label={`Alert for ${alert.student?.name || t('earlyWarning.unknownStudent')}`}
    >
      {/* TOP ROW */}
      <div className="ewa-card__top">
        <div className="ewa-card__student">
          <div className={`ewa-card__avatar ewa-card__avatar--${meta.cls}`}>
            <span className="material-symbols-outlined">{meta.icon}</span>
          </div>
          <div className="ewa-card__student-info">
            <div className="ewa-card__student-header">
              <h4 className="ewa-card__student-name">
                {alert.student?.name || t('earlyWarning.unknownStudent')}
              </h4>
              {alert.student?.email && (
                <span className="ewa-card__student-email">({alert.student.email})</span>
              )}
            </div>
            <div className="ewa-card__meta-row">
              {alert.class?.name && (
                <span className="ewa-card__meta-chip">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>class</span>
                  {alert.class.name}
                </span>
              )}
              {alert.metric && (
                <span className="ewa-card__meta-chip ewa-card__meta-chip--metric">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>query_stats</span>
                  {metricLabel(alert.metric, t)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ewa-card__badges">
          <span className={`ewa-badge ewa-badge--${meta.cls}`}>{meta.label}</span>
          {alert.isResolved && (
            <span className="ewa-badge ewa-badge--resolved">{t('earlyWarning.resolved')}</span>
          )}
          {!alert.isRead && !alert.isResolved && (
            <span className="ewa-badge ewa-badge--new">{t('childProgress.newBadge')}</span>
          )}
          <span className="ewa-card__time text-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
            {fmtRelTime(alert.createdAt, language)}
          </span>
        </div>
      </div>

      {/* DETAIL */}
      <p className="ewa-card__detail text-body-md">{alert.detail}</p>

      {/* ACTIONS */}
      {!alert.isResolved ? (
        <div className="ewa-card__actions">
          <button
            id={`view-profile-${alert._id}`}
            className="ewa-btn ewa-btn--outline"
            onClick={() => navigate(`/teacher/student/${studentId}`)}
            disabled={!studentId}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
            {t('parent.viewChildDetail', 'View Profile')}
          </button>
          <button
            id={`resolve-${alert._id}`}
            className="ewa-btn ewa-btn--primary"
            onClick={() => onResolve(alert._id)}
            disabled={resolving === alert._id}
          >
            {resolving === alert._id ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                {t('childProgress.saving')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                {t('earlyWarning.markResolved')}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="ewa-card__resolved-row">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-success)' }}>verified</span>
          <span className="text-label-sm" style={{ color: 'var(--color-success)' }}>{t('earlyWarning.resolved')}</span>
          <button
            className="ewa-btn ewa-btn--ghost"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate(`/teacher/student/${studentId}`)}
            disabled={!studentId}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
            {t('parent.viewChildDetail', 'View Profile')}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────── */
export default function EarlyWarningAlerts() {
  const { t, language } = useLanguage()
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const hasMore = alerts.length < total

  const typeFilters = [
    { key: '', label: t('earlyWarning.filterAll'), icon: 'filter_list' },
    { key: 'critical', label: t('earlyWarning.filterCritical'), icon: 'warning' },
    { key: 'warning', label: t('earlyWarning.filterWarning'), icon: 'assignment_late' },
    { key: 'info', label: t('earlyWarning.filterInfo'), icon: 'info' },
  ]

  // Track which alerts we auto-marked as read on mount
  const markedReadRef = useRef(new Set())

  /* ── Auto-mark unread alerts as read ─────────────────── */
  async function markAlertRead(alertId) {
    if (markedReadRef.current.has(alertId)) return
    markedReadRef.current.add(alertId)
    try {
      await api.patch(`/alerts/${alertId}/read`)
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, isRead: true } : a))
    } catch {
      // non-critical, ignore
    }
  }

  /* ── Fetch Stats ─────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/alerts/stats')
      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      // non-critical, ignore
    }
  }, [])

  /* ── Fetch Alerts ────────────────────────────────────── */
  const loadAlerts = useCallback(async (reset = false) => {
    const targetPage = reset ? 1 : page
    if (reset) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
        ...(activeFilter ? { type: activeFilter } : {}),
      }

      const res = await api.get('/alerts', { params })

      if (res.success && Array.isArray(res.data)) {
        const incoming = res.data

        setAlerts(prev => {
          if (reset) return incoming
          const existingIds = new Set(prev.map(a => a._id))
          const fresh = incoming.filter(a => !existingIds.has(a._id))
          return [...prev, fresh]
        })

        if (res.pagination) {
          setTotal(res.pagination.total ?? incoming.length)
        } else {
          setTotal(incoming.length)
        }

        // Auto-mark first few unread as read (softly)
        incoming.filter(a => !a.isRead).slice(0, 5).forEach(a => markAlertRead(a._id))
      } else {
        throw new Error(res.message || 'Failed to load alerts')
      }
    } catch (err) {
      setError(err.message || 'Could not fetch alerts. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeFilter, page])

  /* ── Reload on filter change ─────────────────────────── */
  useEffect(() => {
    setPage(1)
    loadAlerts(true)
  }, [activeFilter])

  /* ── Load stats once on mount ────────────────────────── */
  useEffect(() => {
    loadStats()
  }, [loadStats])

  /* ── Resolve an alert ────────────────────────────────── */
  async function handleResolve(alertId) {
    setResolving(alertId)
    try {
      const res = await api.patch(`/alerts/${alertId}/resolve`)
      if (res.success) {
        setAlerts(prev =>
          prev.map(a =>
            a._id === alertId
              ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() }
              : a
          )
        )
        // Refresh stats
        loadStats()
      } else {
        throw new Error(res.message || 'Resolve failed')
      }
    } catch (err) {
      alert(err.message || 'Could not resolve alert.')
    } finally {
      setResolving(null)
    }
  }

  /* ── Filtered list for display ───────────────────────── */
  const displayed = alerts.filter(a => {
    if (!showResolved && a.isResolved) return false
    return true
  })

  // Group into unresolved vs resolved
  const unresolved = displayed.filter(a => !a.isResolved)
  const resolved = displayed.filter(a => a.isResolved)

  // Group unresolved by class name
  const unresolvedGroups = unresolved.reduce((acc, a) => {
    const clsName = a.class?.name || 'No Class Assigned'
    if (!acc[clsName]) acc[clsName] = []
    acc[clsName].push(a)
    return acc
  }, {})

  // Group resolved by class name
  const resolvedGroups = resolved.reduce((acc, a) => {
    const clsName = a.class?.name || 'No Class Assigned'
    if (!acc[clsName]) acc[clsName] = []
    acc[clsName].push(a)
    return acc
  }, {})

  /* ─── RENDER ──────────────────────────────────────────── */
  return (
    <div className="ewa">

      {/* ── HEADER ── */}
      <section className="ewa__header">
        <div className="ewa__header-text">
          <div className="ewa__title-row">
            <div className="ewa__title-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>notifications_active</span>
            </div>
            <div>
              <h2 className="text-headline-lg">{t('earlyWarning.title')}</h2>
              <p className="text-body-md ewa__subtitle">
                {t('earlyWarning.subtitle')}
              </p>
            </div>
          </div>
        </div>
        <button
          className="ewa-btn ewa-btn--refresh"
          onClick={() => { loadAlerts(true); loadStats() }}
          disabled={loading}
          title={t('earlyWarning.refresh')}
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: 20 }}>
            refresh
          </span>
          {t('earlyWarning.refresh')}
        </button>
      </section>

      {/* ── STATS BAR ── */}
      {stats && (
        <div className="ewa__stats animate-fade-in">
          <div className="ewa__stat-item ewa__stat-item--critical">
            <span className="material-symbols-outlined">warning</span>
            <div>
              <span className="ewa__stat-value">{stats.critical ?? 0}</span>
              <span className="ewa__stat-label">{t('earlyWarning.filterCritical')}</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--warning">
            <span className="material-symbols-outlined">assignment_late</span>
            <div>
              <span className="ewa__stat-value">{stats.warning ?? 0}</span>
              <span className="ewa__stat-label">{t('earlyWarning.filterWarning')}</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--info">
            <span className="material-symbols-outlined">info</span>
            <div>
              <span className="ewa__stat-value">{stats.info ?? 0}</span>
              <span className="ewa__stat-label">{t('earlyWarning.filterInfo')}</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--unread">
            <span className="material-symbols-outlined">mark_email_unread</span>
            <div>
              <span className="ewa__stat-value">{stats.unread ?? 0}</span>
              <span className="ewa__stat-label">{t('notif.unread', 'Unread')}</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--total">
            <span className="material-symbols-outlined">list_alt</span>
            <div>
              <span className="ewa__stat-value">{total}</span>
              <span className="ewa__stat-label">{t('common.total', 'Total')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER BAR ── */}
      <div className="ewa__toolbar">
        <div className="ewa__filters" role="tablist" aria-label="Filter alerts by type">
          {typeFilters.map(f => (
            <button
              key={f.key}
              id={`filter-${f.key || 'all'}`}
              role="tab"
              aria-selected={activeFilter === f.key}
              className={`ewa__filter-btn ${activeFilter === f.key ? 'ewa__filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{f.icon}</span>
              {f.label}
              {f.key === '' && unresolved.length > 0 && (
                <span className="ewa__filter-count">{unresolved.length}</span>
              )}
            </button>
          ))}
        </div>

        {resolved.length > 0 && (
          <button
            className={`ewa-btn ${showResolved ? 'ewa-btn--outline-active' : 'ewa-btn--ghost'}`}
            onClick={() => setShowResolved(p => !p)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {showResolved ? 'visibility_off' : 'visibility'}
            </span>
            {showResolved ? t('earlyWarning.hideResolved') : t('earlyWarning.showResolved', { count: resolved.length })}
          </button>
        )}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="ewa__list">
          {[1, 2, 3].map(i => <AlertSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="ewa__state-box card-base ewa__state-box--error animate-fade-in">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>error_outline</span>
          <h3 className="text-title-lg">{t('earlyWarning.somethingWentWrong')}</h3>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error}</p>
          <button className="ewa-btn ewa-btn--primary" onClick={() => { loadAlerts(true); loadStats() }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            {t('earlyWarning.tryAgain')}
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="ewa__state-box card-base animate-fade-in">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-success)' }}>check_circle</span>
          <h3 className="text-title-lg">
            {activeFilter
              ? `No ${activeFilter} alerts found`
              : t('earlyWarning.noActiveAlerts')}
          </h3>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {activeFilter
              ? 'Try a different filter or come back later.'
              : t('earlyWarning.allStudentsOnTrack')}
          </p>
          {activeFilter && (
            <button className="ewa-btn ewa-btn--outline" onClick={() => setActiveFilter('')}>
              {t('earlyWarning.viewAllAlerts')}
            </button>
          )}
        </div>
      ) : (
        <div className="ewa__list">

          {/* Pending section — grouped by class */}
          {unresolved.length > 0 && (
            <div className="ewa__section-wrapper">
              <div className="ewa__section-label">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pending_actions</span>
                {t('earlyWarning.pending', { count: `${unresolved.length}${hasMore ? '+' : ''}` })}
              </div>
              {Object.entries(unresolvedGroups).map(([className, classAlerts]) => (
                <div key={`pending-${className}`} className="ewa__class-group">
                  <div className="ewa__class-group-header">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>class</span>
                    {className}{' '}
                    <span className="ewa__class-group-count">{classAlerts.length}</span>
                  </div>
                  <div className="ewa__class-group-list">
                    {classAlerts.map(a => (
                      <AlertCard
                        key={a._id}
                        alert={a}
                        onResolve={handleResolve}
                        resolving={resolving}
                        t={t}
                        language={language}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolved section — grouped by class (toggle) */}
          {showResolved && resolved.length > 0 && (
            <div className="ewa__section-wrapper">
              <div className="ewa__section-label ewa__section-label--resolved">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
                {t('earlyWarning.resolvedGroup', { count: resolved.length })}
              </div>
              {Object.entries(resolvedGroups).map(([className, classAlerts]) => (
                <div key={`resolved-${className}`} className="ewa__class-group">
                  <div className="ewa__class-group-header ewa__class-group-header--resolved">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>class</span>
                    {className}{' '}
                    <span className="ewa__class-group-count">{classAlerts.length}</span>
                  </div>
                  <div className="ewa__class-group-list">
                    {classAlerts.map(a => (
                      <AlertCard
                        key={a._id}
                        alert={a}
                        onResolve={handleResolve}
                        resolving={resolving}
                        t={t}
                        language={language}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <button
              className="ewa-btn ewa-btn--load-more"
              onClick={() => loadAlerts(false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                  Loading…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
                  {t('earlyWarning.loadMore', { count: total - alerts.length })}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
