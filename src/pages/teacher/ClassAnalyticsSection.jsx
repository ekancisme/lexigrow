import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './ClassAnalyticsSection.css'

export default function ClassAnalyticsSection({ classId }) {
  const [data, setData] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)
      setError('')
      try {
        const [analyticsRes, insightsRes] = await Promise.all([
          api.get(`/classes/${classId}/analytics`),
          api.get(`/classes/${classId}/insights`)
        ])
        setData(analyticsRes.data || null)
        setInsights(insightsRes.data || null)
      } catch (err) {
        console.error('Failed to load class analytics:', err)
        setError(err.message || 'Unable to load class performance analytics.')
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [classId])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ color: 'var(--color-outline)' }}>Loading class performance data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="class-analytics__no-data" style={{ borderColor: 'var(--color-error)' }}>
        <span className="material-symbols-outlined class-analytics__no-data-icon" style={{ color: 'var(--color-error)' }}>error</span>
        <p style={{ color: 'var(--color-on-surface)' }}>{error}</p>
      </div>
    )
  }

  const { summary = {}, trend = [] } = data || {}
  const hasSubmissions = summary.totalEssaysAnalyzed > 0

  if (!hasSubmissions || trend.length === 0) {
    return (
      <div className="class-analytics__no-data">
        <span className="material-symbols-outlined class-analytics__no-data-icon">analytics</span>
        <h3 className="text-title-medium" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>No Performance Data</h3>
        <p className="text-body-md" style={{ marginTop: 4 }}>
          Students in this class have not submitted any essays yet. Growth trend tracking will begin once essays are graded.
        </p>
      </div>
    )
  }

  // Chart configuration
  const chartWidth = 550
  const chartHeight = 220
  const paddingX = 60
  const paddingY = 30

  // Calculate coordinates
  const points = trend.map((item, index) => {
    const x = paddingX + (index / (trend.length - 1)) * (chartWidth - 2 * paddingX)

    // Scale TTR (0-1.0) vertically to (0 - height)
    const yTTR = chartHeight - paddingY - (item.avgTTR * (chartHeight - 2 * paddingY))

    // Scale Grammar (0-10) vertically to (0 - height)
    const yGrammar = chartHeight - paddingY - ((item.avgGrammar / 10) * (chartHeight - 2 * paddingY))

    return { x, yTTR, yGrammar, ...item, index }
  })

  // Build SVG path lines
  const ttrPath = points.length > 1
    ? `M ${points[0].x} ${points[0].yTTR} ` + points.slice(1).map(p => `L ${p.x} ${p.yTTR}`).join(' ')
    : ''
  const ttrArea = points.length > 1
    ? `${ttrPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : ''

  const grammarPath = points.length > 1
    ? `M ${points[0].x} ${points[0].yGrammar} ` + points.slice(1).map(p => `L ${p.x} ${p.yGrammar}`).join(' ')
    : ''
  const grammarArea = points.length > 1
    ? `${grammarPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : ''

  return (
    <div className="class-analytics">

      {/* Actionable Alerts / Warnings banner */}
      {insights?.warnings && insights.warnings.length > 0 && (
        <div className="class-analytics__warnings">
          <div className="class-analytics__warnings-header">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
            <span>Teacher Actionable Alerts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {insights.warnings.map((w, idx) => (
              <div key={idx} className="class-analytics__warning-item">
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-error)', marginTop: '3px' }}>error</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Summary Cards */}
      <div className="class-analytics__summary">
        <div className="class-analytics__card">
          <div className="class-analytics__card-icon class-analytics__card-icon--blue">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div>
            <p className="class-analytics__card-value">
              {Math.round(summary.overallAvgTTR * 100)}%
            </p>
            <p className="class-analytics__card-label">Average Lexical Diversity (TTR)</p>
          </div>
        </div>

        <div className="class-analytics__card">
          <div className="class-analytics__card-icon class-analytics__card-icon--green">
            <span className="material-symbols-outlined">spellcheck</span>
          </div>
          <div>
            <p className="class-analytics__card-value">
              {summary.overallAvgGrammar.toFixed(1)}/10
            </p>
            <p className="class-analytics__card-label">Average Grammar Accuracy</p>
          </div>
        </div>

        <div className="class-analytics__card">
          <div className="class-analytics__card-icon class-analytics__card-icon--purple">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="class-analytics__card-value">
              {summary.totalEssaysAnalyzed}
            </p>
            <p className="class-analytics__card-label">Total Essays Graded</p>
          </div>
        </div>
      </div>

      {/* SVG Trend Chart */}
      <div className="class-analytics__chart-card">
        <div className="class-analytics__chart-header">
          <h4 className="class-analytics__chart-title">Class Development Trend</h4>
          <p className="class-analytics__chart-subtitle">Weekly average TTR and Grammar Accuracy trends over the last 6 weeks</p>
        </div>

        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="ttrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="grammarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#28a745" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#28a745" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--color-outline-variant)" strokeWidth="1" />

            {/* Y Axis Legend labels */}
            <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fontSize="10" fill="var(--color-outline)" fontWeight="600">10 / 100%</text>
            <text x={paddingX - 10} y={chartHeight / 2 + 4} textAnchor="end" fontSize="10" fill="var(--color-outline)" fontWeight="600">5 / 50%</text>
            <text x={paddingX - 10} y={chartHeight - paddingY + 4} textAnchor="end" fontSize="10" fill="var(--color-outline)" fontWeight="600">0 / 0%</text>

            {/* Areas under paths */}
            {ttrArea && <path d={ttrArea} fill="url(#ttrGrad)" />}
            {grammarArea && <path d={grammarArea} fill="url(#grammarGrad)" />}

            {/* Paths lines */}
            {ttrPath && <path d={ttrPath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />}
            {grammarPath && <path d={grammarPath} fill="none" stroke="#28a745" strokeWidth="2.5" />}

            {/* Interactive Circles / Dots */}
            {points.map((p, i) => (
              <g key={i}>
                {/* TTR Dot */}
                <g
                  className="chart-dot"
                  onMouseEnter={() => setHoveredPoint({ ...p, activeMetric: 'TTR', targetY: p.yTTR })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle cx={p.x} cy={p.yTTR} r="4" fill="var(--color-surface-container-lowest)" stroke="var(--color-primary)" strokeWidth="2" />
                  <circle cx={p.x} cy={p.yTTR} r="8" fill="transparent" />
                </g>

                {/* Grammar Dot */}
                <g
                  className="chart-dot"
                  onMouseEnter={() => setHoveredPoint({ ...p, activeMetric: 'Grammar', targetY: p.yGrammar })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle cx={p.x} cy={p.yGrammar} r="4" fill="var(--color-surface-container-lowest)" stroke="#28a745" strokeWidth="2" />
                  <circle cx={p.x} cy={p.yGrammar} r="8" fill="transparent" />
                </g>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.map((p, i) => (
              <text key={i} x={p.x} y={chartHeight - 8} textAnchor="middle" fontSize="9" fill="var(--color-outline)">
                {p.label}
              </text>
            ))}
          </svg>

          {/* Interactive Tooltip Card overlay */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                top: `${(hoveredPoint.targetY / chartHeight) * 100 - 45}%`,
                transform: 'translateX(-50%)',
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                zIndex: 10,
                pointerEvents: 'none',
                minWidth: '130px',
                fontSize: '11px'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '3px' }}>
                {hoveredPoint.label}
              </div>
              <div style={{ display: 'column', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                <span style={{ color: 'var(--color-outline)' }}>Avg TTR:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{Math.round(hoveredPoint.avgTTR * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                <span style={{ color: 'var(--color-outline)' }}>Avg Grammar:</span>
                <span style={{ fontWeight: 600, color: '#28a745' }}>{hoveredPoint.avgGrammar.toFixed(1)}/10</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '2px', borderTop: '1px dashed var(--color-outline-variant)', paddingTop: '2px' }}>
                <span style={{ color: 'var(--color-outline)' }}>Essays:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{hoveredPoint.essayCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="class-analytics__chart-legend">
          <div className="class-analytics__legend-item">
            <div className="class-analytics__legend-color" style={{ background: 'var(--color-primary)' }} />
            <span>Type-Token Ratio (TTR - Vocab Diversity)</span>
          </div>
          <div className="class-analytics__legend-item">
            <div className="class-analytics__legend-color" style={{ background: '#28a745' }} />
            <span>Grammar Accuracy (0-10 Score)</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Insights */}
      <div className="class-analytics__row">

        {/* Left Column: Top Overused Words */}
        <div className="class-analytics__section-card">
          <h4 className="class-analytics__section-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>forum</span>
            Top Overused Words
          </h4>
          <p className="text-body-sm" style={{ color: 'var(--color-outline)', marginBottom: '8px' }}>
            Most frequently repeated words across class essays (excluding common stop words)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {insights?.repeatedWords && insights.repeatedWords.length > 0 ? (
              insights.repeatedWords.map((item, idx) => {
                const maxCount = insights.repeatedWords[0].count
                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={idx} className="class-analytics__repeated-word-row">
                    <div className="class-analytics__repeated-word-info">
                      <span style={{ color: 'var(--color-on-surface)', fontWeight: 700 }}>"{item.word}"</span>
                      <span style={{ color: 'var(--color-outline)' }}>
                        {item.count} times ({item.studentCount} students)
                      </span>
                    </div>
                    <div className="class-analytics__progress-track">
                      <div className="class-analytics__progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p style={{ color: 'var(--color-outline)', fontStyle: 'italic', fontSize: '0.9rem' }}>No word repetitions detected.</p>
            )}
          </div>
        </div>

        {/* Right Column: Writing & Grammar Weaknesses Accordions */}
        <div className="class-analytics__section-card">
          <h4 className="class-analytics__section-title">
            <span className="material-symbols-outlined" style={{ color: '#28a745' }}>rule</span>
            Writing & Grammar Weaknesses
          </h4>
          <p className="text-body-sm" style={{ color: 'var(--color-outline)', marginBottom: '8px' }}>
            Top categories of grammar/style corrections suggested by AI for students in this class
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights?.grammarErrors && insights.grammarErrors.length > 0 ? (
              insights.grammarErrors.map((item, idx) => {
                const isOpen = expandedCategory === item.category
                return (
                  <div key={idx} className="class-analytics__accordion">
                    <div
                      className="class-analytics__accordion-header"
                      onClick={() => setExpandedCategory(isOpen ? null : item.category)}
                    >
                      <span>{item.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          background: 'var(--color-error-container)',
                          color: 'var(--color-error)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {item.count} issues
                        </span>
                        <span className="material-symbols-outlined" style={{
                          fontSize: '18px',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          color: 'var(--color-outline)'
                        }}>
                          expand_more
                        </span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="class-analytics__accordion-body">
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-outline)', fontWeight: 600, marginBottom: '4px' }}>
                          Sample suggestions from student essays:
                        </p>
                        {item.examples.map((ex, eIdx) => (
                          <div key={eIdx} className="class-analytics__accordion-example">
                            "{ex}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p style={{ color: 'var(--color-outline)', fontStyle: 'italic', fontSize: '0.9rem' }}>No writing suggestions detected.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
