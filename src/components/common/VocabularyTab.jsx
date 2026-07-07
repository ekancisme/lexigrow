import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api.js'
import './VocabularyTab.css'

/* ─── Constants ──────────────────────────────────────── */
const MASTERY_COLORS = {
  new:      { bg: 'rgba(245,166,35,0.12)',  text: '#c97c00', label: 'New'      },
  learning: { bg: 'rgba(124,77,255,0.12)', text: '#7c4dff', label: 'Learning'  },
  mastered: { bg: 'rgba(41,182,246,0.12)', text: '#0293c5', label: 'Mastered'  },
}

const CATEGORIES = [
  { value: 'all',        label: 'All Categories' },
  { value: 'academic',   label: 'Academic'       },
  { value: 'business',   label: 'Business'       },
  { value: 'scientific', label: 'Scientific'     },
  { value: 'daily',      label: 'Daily'          },
]
const MASTERY_OPTS = [
  { value: 'all',      label: 'All Levels' },
  { value: 'new',      label: 'New'        },
  { value: 'learning', label: 'Learning'   },
  { value: 'mastered', label: 'Mastered'   },
]
const SORT_OPTS = [
  { value: 'createdAt',    label: 'Most Recent'   },
  { value: 'word',         label: 'A – Z'         },
  { value: 'masteryLevel', label: 'Mastery Level' },
]

/* ─── Donut Chart (pure SVG, no library) ──────────────── */
function DonutChart({ distribution, total }) {
  const segments = [
    { key: 'new',      color: '#f5a623', value: distribution.new      },
    { key: 'learning', color: '#7c4dff', value: distribution.learning  },
    { key: 'mastered', color: '#29b6f6', value: distribution.mastered  },
  ]

  const r  = 54
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r

  let offset = 0
  const slices = segments.map(seg => {
    const pct   = total > 0 ? seg.value / total : 0
    const dash  = pct * circumference
    const gap   = circumference - dash
    const slice = { ...seg, pct, dash, gap, offset }
    offset += dash
    return slice
  })

  return (
    <div className="vt-donut">
      <svg viewBox="0 0 140 140" className="vt-donut__svg">
        {/* background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--color-outline-variant)" strokeWidth="16" />
        {/* colored slices */}
        {slices.map(s => (
          s.pct > 0 && (
            <circle key={s.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
              className="vt-donut__slice"
            />
          )
        ))}
        {/* center text */}
        <text x={cx} y={cy - 6} textAnchor="middle"
          className="vt-donut__center-num">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle"
          className="vt-donut__center-label">words</text>
      </svg>
      <div className="vt-donut__legend">
        {segments.map(s => (
          <div key={s.key} className="vt-donut__legend-item">
            <span className="vt-donut__dot" style={{ background: s.color }} />
            <span className="vt-donut__legend-label"
              style={{ color: MASTERY_COLORS[s.key].text }}>
              {MASTERY_COLORS[s.key].label}
            </span>
            <span className="vt-donut__legend-count">{distribution[s.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Category breakdown ──────────────────────────────── */
function CategoryBreakdown({ stats }) {
  if (!stats || stats.length === 0) {
    return <p className="vt-empty-small">No category data</p>
  }
  return (
    <div className="vt-categories">
      {stats.map(cat => (
        <div key={cat.key} className="vt-cat-row">
          <div className="vt-cat-row__header">
            <span className="text-label-md vt-cat-row__name">{cat.name}</span>
            <span className="text-label-sm vt-cat-row__counts">
              {cat.mastered}/{cat.total} mastered
            </span>
          </div>
          <div className="vt-progress-bar">
            <div
              className="vt-progress-fill"
              style={{ width: `${cat.progress}%` }}
            />
          </div>
          <span className="vt-cat-row__pct">{cat.progress}%</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Mastery badge ───────────────────────────────────── */
function MasteryBadge({ level }) {
  const c = MASTERY_COLORS[level] || MASTERY_COLORS.new
  return (
    <span className="vt-badge" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}

/* ─── Main VocabularyTab Component ───────────────────── */
/**
 * Props:
 *   apiBase  — e.g. "/teacher/students/123/vocabulary"
 *              or   "/parent/children/456/vocabulary"
 */
export default function VocabularyTab({ apiBase }) {
  const [vocabData, setVocabData] = useState(null)   // { words, masteryDistribution, categoryStats, … }
  const [total,     setTotal]     = useState(0)
  const [pages,     setPages]     = useState(1)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const [page,     setPage]     = useState(1)
  const [category, setCategory] = useState('all')
  const [mastery,  setMastery]  = useState('all')
  const [sort,     setSort]     = useState('createdAt')

  const fetchData = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: 15, sort })
      if (category !== 'all') params.set('category', category)
      if (mastery  !== 'all') params.set('mastery',  mastery)

      const res = await api.get(`${apiBase}?${params}`)
      setVocabData(res.data)
      setTotal(res.total ?? 0)
      setPages(res.pages ?? 1)
    } catch (err) {
      setError(err.message || 'Failed to load vocabulary data.')
    } finally {
      setLoading(false)
    }
  }, [apiBase, page, category, mastery, sort])

  useEffect(() => { fetchData() }, [fetchData])

  /* Reset to page 1 when filters change */
  function handleFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="vt">
        <div className="vt-stats-row">
          {[1, 2, 3].map(i => (
            <div key={i} className="vt-stat-card shimmer" style={{ height: 80 }} />
          ))}
        </div>
        <div className="vt-charts-row">
          <div className="vt-card shimmer" style={{ height: 200 }} />
          <div className="vt-card shimmer" style={{ height: 200 }} />
        </div>
        <div className="vt-card shimmer" style={{ height: 300 }} />
      </div>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="vt vt__state-box">
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>
          error_outline
        </span>
        <h3 className="text-title-lg">Failed to load vocabulary</h3>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error}</p>
        <button className="vt-btn vt-btn--primary" onClick={fetchData}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
          Try Again
        </button>
      </div>
    )
  }

  const { words = [], masteryDistribution = {}, categoryStats = [],
          totalVocabulary = 0, masteredCount = 0, masteryRate = 0 } = vocabData || {}

  return (
    <div className="vt animate-fade-in">

      {/* ── STATS ROW ── */}
      <div className="vt-stats-row">
        <div className="vt-stat-card vt-stat-card--total">
          <span className="material-symbols-outlined vt-stat-card__icon">library_books</span>
          <div>
            <p className="vt-stat-card__value">{totalVocabulary}</p>
            <p className="vt-stat-card__label">Total Words</p>
          </div>
        </div>
        <div className="vt-stat-card vt-stat-card--rate">
          <span className="material-symbols-outlined vt-stat-card__icon">trending_up</span>
          <div>
            <p className="vt-stat-card__value">{masteryRate}%</p>
            <p className="vt-stat-card__label">Mastery Rate</p>
          </div>
        </div>
        <div className="vt-stat-card vt-stat-card--mastered">
          <span className="material-symbols-outlined vt-stat-card__icon">check_circle</span>
          <div>
            <p className="vt-stat-card__value">{masteredCount}</p>
            <p className="vt-stat-card__label">Mastered</p>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="vt-charts-row">
        {/* Donut */}
        <div className="vt-card">
          <h4 className="text-title-lg vt-card__title">Mastery Distribution</h4>
          {totalVocabulary === 0 ? (
            <p className="vt-empty-small">No vocabulary yet</p>
          ) : (
            <DonutChart distribution={masteryDistribution} total={totalVocabulary} />
          )}
        </div>

        {/* Category breakdown */}
        <div className="vt-card">
          <h4 className="text-title-lg vt-card__title">Category Breakdown</h4>
          <CategoryBreakdown stats={categoryStats} />
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="vt-filters">
        <div className="vt-select-wrap">
          <span className="material-symbols-outlined vt-select-wrap__icon">category</span>
          <select
            id="vt-filter-category"
            className="vt-select"
            value={category}
            onChange={e => handleFilter(setCategory, e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="vt-select-wrap">
          <span className="material-symbols-outlined vt-select-wrap__icon">grade</span>
          <select
            id="vt-filter-mastery"
            className="vt-select"
            value={mastery}
            onChange={e => handleFilter(setMastery, e.target.value)}
          >
            {MASTERY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="vt-select-wrap">
          <span className="material-symbols-outlined vt-select-wrap__icon">sort</span>
          <select
            id="vt-sort"
            className="vt-select"
            value={sort}
            onChange={e => handleFilter(setSort, e.target.value)}
          >
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span className="vt-filter-result text-label-sm">
          {total} word{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* ── TABLE ── */}
      <div className="vt-card vt-card--table">
        {words.length === 0 ? (
          <div className="vt__state-box">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-outline)' }}>
              search_off
            </span>
            <h3 className="text-title-lg">No vocabulary data found</h3>
            <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
              Try adjusting the filters or come back later.
            </p>
          </div>
        ) : (
          <>
            <div className="vt-table-wrap">
              <table className="vt-table">
                <thead>
                  <tr>
                    <th>WORD</th>
                    <th>DEFINITION</th>
                    <th>CATEGORY</th>
                    <th>MASTERY</th>
                    <th>DATE ADDED</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map(w => (
                    <tr key={w._id} className="vt-table__row">
                      <td>
                        <div>
                          <span className="vt-table__word">{w.word}</span>
                          {w.ipa && (
                            <span className="vt-table__ipa"> /{w.ipa}/</span>
                          )}
                        </div>
                      </td>
                      <td className="vt-table__def">
                        {w.definition || <span className="vt-table__empty-cell">—</span>}
                      </td>
                      <td>
                        <span className="vt-cat-tag">{w.category}</span>
                      </td>
                      <td>
                        <MasteryBadge level={w.masteryLevel} />
                      </td>
                      <td className="vt-table__date">
                        {new Date(w.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="vt-pagination">
                <button
                  id="vt-prev-page"
                  className="vt-btn vt-btn--outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                  Previous
                </button>
                <span className="vt-pagination__label text-label-md">
                  Page {page} of {pages}
                </span>
                <button
                  id="vt-next-page"
                  className="vt-btn vt-btn--outline"
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                >
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
