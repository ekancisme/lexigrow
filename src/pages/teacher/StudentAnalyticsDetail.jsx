import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import VocabularyTab from '../../components/common/VocabularyTab.jsx'
import './StudentAnalyticsDetail.css'

const TABS = [
  { key: 'overview',   label: 'Overview',   icon: 'overview'      },
  { key: 'vocabulary', label: 'Vocabulary', icon: 'library_books' },
]

/* ── Score badge color helper ─────────────────────── */
function scoreBadgeClass(score) {
  if (score >= 8) return 'sa-score-badge--high'
  if (score >= 5) return 'sa-score-badge--mid'
  return 'sa-score-badge--low'
}

/* ── Learning Status Badge ────────────────────────── */
const STATUS_CONFIG = {
  growing:    { icon: 'trending_up',   label: 'Growing',    cls: 'sa-status--growing'    },
  stagnating: { icon: 'trending_flat', label: 'Stagnating', cls: 'sa-status--stagnating' },
  declining:  { icon: 'trending_down', label: 'Declining',  cls: 'sa-status--declining'  },
}

function LearningStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.stagnating
  return (
    <span className={`sa-status-badge ${cfg.cls}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

export default function StudentAnalyticsDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState('overview')

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/teacher/students/${id}`)
        setData(res.data)
      } catch (err) {
        console.error('Error fetching student details:', err)
        setError(err.message || 'Failed to load student data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="sa" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="sa" style={{ padding: 24, textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>error_outline</span>
        <h3 className="text-title-lg" style={{ color: 'var(--color-error)', marginTop: 12 }}>
          {error || 'Student data not found'}
        </h3>
        <button className="sa-back-btn" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
          ← Go Back
        </button>
      </div>
    )
  }

  const { student, class: className, metrics, essayHistory, learningStatus } = data
  const latestEssay = essayHistory?.[0]

  return (
    <div className="sa">

      {/* Back button */}
      <button className="sa-back-btn" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined">arrow_back</span> Back
      </button>

      {/* ══ BLOCK 1: PROFILE CARD ════════════════════════════ */}
      <section className="sa-profile card-base">
        <div className="sa-profile__avatar">
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
            person
          </span>
        </div>

        <div className="sa-profile__info">
          <div className="sa-profile__name-row">
            <h2 className="text-headline-lg sa-profile__name">{student?.name}</h2>
            {learningStatus && <LearningStatusBadge status={learningStatus} />}
          </div>
          <div className="sa-profile__meta">
            <span className="sa-meta-chip">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>mail</span>
              {student?.email}
            </span>
            <span className="sa-meta-chip">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>class</span>
              {className || 'N/A'}
            </span>
            <span className="sa-meta-chip">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>signal_cellular_alt</span>
              {student?.englishLevel || 'N/A'} Level
            </span>
            <span className="sa-meta-chip sa-meta-chip--muted">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_today</span>
              Joined {new Date(student?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Quick action */}
        {latestEssay && (
          <button
            className="sa-feedback-btn"
            onClick={() => navigate(`/teacher/feedback/${latestEssay._id}`)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rate_review</span>
            Write Feedback
          </button>
        )}
      </section>

      {/* ══ TABS ════════════════════════════════════════════ */}
      <div className="sa-tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`sa-tab ${activeTab === tab.key ? 'sa-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: OVERVIEW ══════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">

          {/* ── BLOCK 2: VOCABULARY STATS ── */}
          <section className="sa-vocab-stats">
            <div className="sa-vocab-card sa-vocab-card--total card-base">
              <span className="material-symbols-outlined sa-vocab-card__icon">library_books</span>
              <div>
                <p className="sa-vocab-card__value">{metrics?.vocabularySize ?? 0}</p>
                <p className="sa-vocab-card__label">Total Words Learned</p>
              </div>
            </div>

            <div className="sa-vocab-card sa-vocab-card--mastery card-base">
              <span className="material-symbols-outlined sa-vocab-card__icon">verified</span>
              <div>
                <p className="sa-vocab-card__value">{metrics?.masteryRate ?? 0}%</p>
                <p className="sa-vocab-card__label">Mastery Rate</p>
                <p className="sa-vocab-card__sub">
                  {metrics?.masteredVocab ?? 0} / {metrics?.vocabularySize ?? 0} mastered
                </p>
              </div>
              {/* mini progress bar */}
              <div className="sa-vocab-card__bar-wrap">
                <div
                  className="sa-vocab-card__bar-fill"
                  style={{ width: `${metrics?.masteryRate ?? 0}%` }}
                />
              </div>
            </div>
          </section>

          {/* ── BLOCK 3: ESSAY HISTORY TABLE ── */}
          <section className="card-base sa-essays">
            <div className="sa-essays__header">
              <h3 className="text-title-lg">Essay History</h3>
              <span className="sa-essays__count text-label-sm">
                {essayHistory?.length ?? 0} essay{essayHistory?.length !== 1 ? 's' : ''}
              </span>
            </div>

            {!essayHistory || essayHistory.length === 0 ? (
              <div className="sa-essays__empty">
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>
                  description
                </span>
                <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
                  This student has not submitted any essays yet.
                </p>
              </div>
            ) : (
              <div className="sa-essays__table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>TITLE</th>
                      <th>WORDS</th>
                      <th>SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {essayHistory.map(e => (
                      <tr key={e._id} className="sa-table__row">
                        <td className="sa-table__date">
                          {new Date(e.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </td>
                        <td className="sa-table__title">{e.title || 'Untitled'}</td>
                        <td className="sa-table__words">
                          <span className="sa-table__words-chip">{e.words ?? '—'}</span>
                        </td>
                        <td>
                          <span className={`sa-score-badge ${scoreBadgeClass(e.score)}`}>
                            {e.score}/10
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══ TAB: VOCABULARY ════════════════════════════════ */}
      {activeTab === 'vocabulary' && (
        <div className="animate-fade-in">
          <VocabularyTab apiBase={`/teacher/students/${id}/vocabulary`} />
        </div>
      )}
    </div>
  )
}
