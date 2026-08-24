import { useState, useEffect } from 'react'
import api from '../../services/api'
import AdminSettings from './AdminSettings'
import './AdminPages.css'

export default function AdminAIMonitoring() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [errorAnalytics, setErrorAnalytics] = useState(null)

  // Logs list states
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [errorLogs, setErrorLogs] = useState(null)

  // Filters for logs
  const [filterAction, setFilterAction] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterModel, setFilterModel] = useState('')

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState(null)

  // Fetch monitoring analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    setErrorAnalytics(null)
    try {
      const res = await api.get('/admin/ai/monitoring')
      setAnalytics(res.data)
    } catch (err) {
      console.error('Error fetching AI analytics:', err)
      setErrorAnalytics(err.message || 'Unable to load AI monitoring data')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Fetch AI logs
  const fetchLogs = async () => {
    setLoadingLogs(true)
    setErrorLogs(null)
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        action: filterAction,
        status: filterStatus,
        model: filterModel
      })
      const res = await api.get(`/admin/ai/logs?${queryParams.toString()}`)
      setLogs(res.data || [])
      setTotalPages(res.pagination?.pages || 1)
    } catch (err) {
      console.error('Error fetching AI logs:', err)
      setErrorLogs(err.message || 'Unable to load AI call history')
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'monitoring') {
      fetchAnalytics()
      fetchLogs()
    }
  }, [activeTab, page, filterAction, filterStatus, filterModel])

  // Trigger seeding / refresh dashboard
  const handleRefresh = () => {
    fetchAnalytics()
    fetchLogs()
  }

  const { metrics = {}, dailyStats = [] } = analytics || {}

  // SVG Chart Dimensions
  const chartWidth = 500
  const chartHeight = 160
  const paddingX = 45
  const paddingY = 25

  // 1. Chart 1: AI Calls Stacked Bar Chart (Success vs Failed)
  const maxCalls = dailyStats.length > 0 ? Math.max(...dailyStats.map(d => d.calls)) : 10
  const barPadding = 12
  const barWidth = dailyStats.length > 0 
    ? (chartWidth - 2 * paddingX) / dailyStats.length - barPadding
    : 30

  // 2. Chart 2: Estimated Cost Area Chart
  const maxCost = dailyStats.length > 0 ? Math.max(...dailyStats.map(d => d.cost)) : 0.01
  const costPoints = dailyStats.map((d, index) => {
    const x = paddingX + (index / Math.max(1, dailyStats.length - 1)) * (chartWidth - 2 * paddingX)
    const y = chartHeight - paddingY - (d.cost / maxCost) * (chartHeight - 2 * paddingY)
    return { x, y, label: d._id.substring(5), cost: d.cost }
  })
  const costPath = costPoints.length > 1
    ? `M ${costPoints[0].x} ${costPoints[0].y} ` + costPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : ''
  const costArea = costPoints.length > 1
    ? `${costPath} L ${costPoints[costPoints.length - 1].x} ${chartHeight - paddingY} L ${costPoints[0].x} ${chartHeight - paddingY} Z`
    : ''

  // 3. Chart 3: Failures Line Chart
  const maxFailed = dailyStats.length > 0 ? Math.max(...dailyStats.map(d => d.failed)) : 5
  const failedPoints = dailyStats.map((d, index) => {
    const x = paddingX + (index / Math.max(1, dailyStats.length - 1)) * (chartWidth - 2 * paddingX)
    const y = chartHeight - paddingY - (d.failed / maxFailed) * (chartHeight - 2 * paddingY)
    return { x, y, label: d._id.substring(5), failed: d.failed }
  })
  const failedPath = failedPoints.length > 1
    ? `M ${failedPoints[0].x} ${failedPoints[0].y} ` + failedPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : ''

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header" style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px', marginBottom: '8px' }}>
        <div>
          <h2 className="admin-page__title">AI Config & Monitoring</h2>
          <p className="admin-page__subtitle">Monitor operational performance, token costs, and configure AI model parameters.</p>
        </div>

        {activeTab === 'monitoring' && (
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--color-primary)',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            Refresh Metrics
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', gap: '24px', marginBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('monitoring')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'monitoring' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'monitoring' ? 'var(--color-primary)' : 'var(--color-outline)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>monitoring</span>
          AI Monitoring
        </button>

        <button
          onClick={() => setActiveTab('config')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'config' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'config' ? 'var(--color-primary)' : 'var(--color-outline)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings_accessibility</span>
          System Configuration
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'config' ? (
        <AdminSettings />
      ) : (
        <>
          {loadingAnalytics ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
                progress_activity
              </span>
              <p style={{ color: 'var(--color-outline)', fontSize: '14px' }}>Loading AI statistics...</p>
            </div>
          ) : errorAnalytics ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '8px' }}>error</span>
              <p>{errorAnalytics}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Metrics Summary Grid */}
              <div className="admin-page__stats">
                <div className="admin-stat-card card-base">
                  <div className="admin-stat-card__icon admin-stat-card__icon--blue">
                    <span className="material-symbols-outlined">api</span>
                  </div>
                  <div>
                    <p className="admin-stat-card__value">{metrics.totalCalls || 0}</p>
                    <p className="admin-stat-card__label">Total AI Calls</p>
                  </div>
                </div>

                <div className="admin-stat-card card-base">
                  <div className="admin-stat-card__icon admin-stat-card__icon--green">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <div>
                    <p className="admin-stat-card__value">{metrics.successRate || 100}%</p>
                    <p className="admin-stat-card__label">Success Rate</p>
                  </div>
                </div>

                <div className="admin-stat-card card-base">
                  <div className="admin-stat-card__icon admin-stat-card__icon--orange">
                    <span className="material-symbols-outlined">toll</span>
                  </div>
                  <div>
                    <p className="admin-stat-card__value">{metrics.totalTokens?.toLocaleString() || 0}</p>
                    <p className="admin-stat-card__label">Tokens Consumed</p>
                  </div>
                </div>

                <div className="admin-stat-card card-base">
                  <div className="admin-stat-card__icon admin-stat-card__icon--purple">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="admin-stat-card__value">${metrics.totalCost?.toFixed(4) || '0.0000'}</p>
                    <p className="admin-stat-card__label">Estimated Cost</p>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                
                {/* Chart 1: AI Calls Stacked Bar */}
                <div className="admin-card card-base" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>AI API Call Frequency</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '16px' }}>Success and Failure by day</p>
                  {dailyStats.length === 0 ? (
                    <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-outline)' }}>No data available</div>
                  ) : (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight}>
                      <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--color-outline-variant)" strokeWidth="1" />
                      {dailyStats.map((item, i) => {
                        const x = paddingX + i * (barWidth + barPadding) + barPadding / 2
                        const successH = (item.success / maxCalls) * (chartHeight - 2 * paddingY)
                        const failedH = (item.failed / maxCalls) * (chartHeight - 2 * paddingY)
                        
                        return (
                          <g key={i}>
                            {/* Success Bar */}
                            <rect x={x} y={chartHeight - paddingY - successH} width={barWidth} height={successH} fill="#28a745" rx="2" />
                            {/* Failed Bar */}
                            {item.failed > 0 && (
                              <rect x={x} y={chartHeight - paddingY - successH - failedH} width={barWidth} height={failedH} fill="var(--color-error)" rx="2" />
                            )}
                            {/* X-axis Label */}
                            <text x={x + barWidth / 2} y={chartHeight - 6} textAnchor="middle" fontSize="8" fill="var(--color-outline)">{item._id.substring(5)}</text>
                            {/* Label above bar */}
                            <text x={x + barWidth / 2} y={chartHeight - paddingY - successH - failedH - 6} textAnchor="middle" fontSize="8" fill="var(--color-on-surface)" fontWeight="bold">{item.calls}</text>
                          </g>
                        )
                      })}
                    </svg>
                  )}
                </div>

                {/* Chart 2: Cost Area Chart */}
                <div className="admin-card card-base" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>Token Usage Cost</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '16px' }}>Estimated cost (USD) daily</p>
                  {dailyStats.length === 0 ? (
                    <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-outline)' }}>No data available</div>
                  ) : (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight}>
                      <defs>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--color-outline-variant)" strokeWidth="1" />
                      
                      {costArea && <path d={costArea} fill="url(#costGrad)" />}
                      {costPath && <path d={costPath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />}
                      
                      {costPoints.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="3" fill="var(--color-surface-container-lowest)" stroke="var(--color-primary)" strokeWidth="1.5" />
                          <text x={p.x} y={chartHeight - 6} textAnchor="middle" fontSize="8" fill="var(--color-outline)">{p.label}</text>
                          <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="8" fill="var(--color-on-surface)" fontWeight="bold">${p.cost.toFixed(4)}</text>
                        </g>
                      ))}
                    </svg>
                  )}
                </div>

                {/* Chart 3: Failed Requests Chart */}
                <div className="admin-card card-base" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>API Errors</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '16px' }}>API failures over time</p>
                  {dailyStats.length === 0 ? (
                    <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-outline)' }}>No data available</div>
                  ) : (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight}>
                      <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--color-outline-variant)" strokeWidth="1" />
                      
                      {failedPath && <path d={failedPath} fill="none" stroke="var(--color-error)" strokeWidth="2" strokeDasharray="4,2" />}
                      
                      {failedPoints.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="3" fill="var(--color-surface-container-lowest)" stroke="var(--color-error)" strokeWidth="1.5" />
                          <text x={p.x} y={chartHeight - 6} textAnchor="middle" fontSize="8" fill="var(--color-outline)">{p.label}</text>
                          <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="8" fill="var(--color-error)" fontWeight="bold">{p.failed}</text>
                        </g>
                      ))}
                    </svg>
                  )}
                </div>

              </div>

              {/* Logs Filter & Logs List */}
              <div className="admin-card card-base" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Detailed AI Call History</h3>
                  
                  {/* Filters Form */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    
                    {/* Action Filter */}
                    <select
                      value={filterAction}
                      onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', fontSize: '13px', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                    >
                      <option value="">All functions</option>
                      <option value="essay_analysis">essay_analysis</option>
                      <option value="synonym_generation">synonym_generation</option>
                      <option value="topic_generation">topic_generation</option>
                      <option value="vocabulary_enrichment">vocabulary_enrichment</option>
                      <option value="translation">translation</option>
                      <option value="synonym_recommendation">synonym_recommendation</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', fontSize: '13px', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                    >
                      <option value="">All statuses</option>
                      <option value="success">Success</option>
                      <option value="failure">Failure</option>
                    </select>

                    {/* Model Filter */}
                    <select
                      value={filterModel}
                      onChange={(e) => { setFilterModel(e.target.value); setPage(1); }}
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', fontSize: '13px', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                    >
                      <option value="">All models</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="gemma2-9b-it">gemma2-9b-it</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>

                {/* Logs Table */}
                {loadingLogs ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '150px', gap: '12px' }}>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--color-primary)' }}>
                      progress_activity
                    </span>
                    <p style={{ color: 'var(--color-outline)', fontSize: '13px' }}>Loading AI call history...</p>
                  </div>
                ) : errorLogs ? (
                  <div style={{ padding: '16px', color: 'var(--color-error)', textAlign: 'center' }}>{errorLogs}</div>
                ) : logs.length === 0 ? (
                  <div style={{ padding: '32px', color: 'var(--color-outline)', textAlign: 'center' }}>No matching AI call logs found.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--color-outline-variant)', color: 'var(--color-outline)', fontWeight: 600 }}>
                          <th style={{ padding: '12px 8px' }}>Timestamp</th>
                          <th style={{ padding: '12px 8px' }}>Function</th>
                          <th style={{ padding: '12px 8px' }}>Model</th>
                          <th style={{ padding: '12px 8px' }}>Status</th>
                          <th style={{ padding: '12px 8px' }}>Latency</th>
                          <th style={{ padding: '12px 8px' }}>Tokens</th>
                          <th style={{ padding: '12px 8px' }}>Cost</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center' }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log._id} style={{ borderBottom: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}>
                            <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', fontSize: '13px' }}>
                              {new Date(log.createdAt).toLocaleString('en-US')}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--color-primary)' }}>{log.action}</td>
                            <td style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--color-outline)' }}>{log.model}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: log.status === 'success' ? 'rgba(40, 167, 69, 0.12)' : 'rgba(211, 47, 47, 0.12)',
                                color: log.status === 'success' ? '#28a745' : 'var(--color-error)'
                              }}>
                                {log.status === 'success' ? 'Success' : 'Error'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>{log.processingTimeMs} ms</td>
                            <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                              {log.tokensUsed?.totalTokens?.toLocaleString() || 0}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                              ${log.costEstimate?.toFixed(5) || '0.00000'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <button
                                onClick={() => setSelectedLog(log)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-primary)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--color-outline)' }}>
                        Page {page} / {totalPages}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            border: '1px solid var(--color-outline-variant)',
                            color: page === 1 ? 'var(--color-outline)' : 'var(--color-on-surface)',
                            borderRadius: 'var(--radius-md)',
                            cursor: page === 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            border: '1px solid var(--color-outline-variant)',
                            color: page === totalPages ? 'var(--color-outline)' : 'var(--color-on-surface)',
                            borderRadius: 'var(--radius-md)',
                            cursor: page === totalPages ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Log Detail Modal */}
              {selectedLog && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '20px'
                }}>
                  <div className="admin-card card-base" style={{
                    width: '100%',
                    maxWidth: '550px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative',
                    animation: 'scaleIn 0.2s ease',
                    padding: '24px'
                  }}>
                    <button
                      onClick={() => setSelectedLog(null)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-outline)',
                        cursor: 'pointer'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                    </button>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-on-surface)' }}>AI Call Details</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>Call ID:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{selectedLog._id}</span>
                      </div>
                      
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>Timestamp:</span>
                        <span>{new Date(selectedLog.createdAt).toLocaleString('en-US')}</span>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>Function:</span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{selectedLog.action}</span>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>AI Model:</span>
                        <span>{selectedLog.model}</span>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>Status:</span>
                        <span style={{
                          fontWeight: 700,
                          color: selectedLog.status === 'success' ? '#28a745' : 'var(--color-error)'
                        }}>
                          {selectedLog.status === 'success' ? 'Success' : 'Error'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>Latency:</span>
                        <span>{selectedLog.processingTimeMs} ms</span>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-outline)' }}>Tokens Consumed:</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', fontSize: '13px', background: 'var(--color-surface-container-low)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                          <div>Prompt: {selectedLog.tokensUsed?.promptTokens || 0}</div>
                          <div>Completion: {selectedLog.tokensUsed?.completionTokens || 0}</div>
                          <div>Total: {selectedLog.tokensUsed?.totalTokens || 0}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                        <span style={{ width: '130px', fontWeight: 600, color: 'var(--color-outline)' }}>Cost (USD):</span>
                        <span style={{ fontWeight: 'bold' }}>${selectedLog.costEstimate?.toFixed(5) || '0.00000'}</span>
                      </div>

                      {selectedLog.status === 'failure' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>Error Message:</span>
                          <div style={{
                            padding: '10px',
                            background: 'rgba(211, 47, 47, 0.08)',
                            border: '1px solid var(--color-error)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            color: 'var(--color-error)',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {selectedLog.errorMessage || 'Unknown error'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}
    </div>
  )
}
