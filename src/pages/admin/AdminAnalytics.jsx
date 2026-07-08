import { useState, useEffect } from 'react'
import api from '../../services/api'
import './AdminPages.css'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/admin/analytics')
        setAnalytics(res.data)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err.message || 'Không thể tải thống kê hệ thống')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>Đang tải dữ liệu thống kê...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '8px' }}>error</span>
        <p>{error}</p>
      </div>
    )
  }

  const { metrics = { roles: {} }, charts = {} } = analytics || {}

  // 1. Roles breakdown values
  const studentCount = metrics?.roles?.student || 0
  const teacherCount = metrics?.roles?.teacher || 0
  const parentCount = metrics?.roles?.parent || 0
  const totalRoles = studentCount + teacherCount + parentCount
  const studentPct = totalRoles ? Math.round((studentCount / totalRoles) * 100) : 0
  const teacherPct = totalRoles ? Math.round((teacherCount / totalRoles) * 100) : 0
  const parentPct = totalRoles ? Math.round((parentCount / totalRoles) * 100) : 0

  // 2. SVG Line/Area Chart calculation for User Growth
  const userGrowthList = charts?.userGrowth || []
  const maxGrowth = userGrowthList.length > 0 ? Math.max(...userGrowthList.map(c => c.count)) : 10
  const paddingX = 40
  const paddingY = 20
  const chartWidth = 450
  const chartHeight = 150
  const points = userGrowthList.map((item, index) => {
    const x = paddingX + (index / Math.max(1, userGrowthList.length - 1)) * (chartWidth - 2 * paddingX)
    const y = chartHeight - paddingY - (item.count / maxGrowth) * (chartHeight - 2 * paddingY)
    return { x, y, ...item }
  })
  const pathData = points.length > 1
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : ''
  const areaData = points.length > 1
    ? `${pathData} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : ''

  // 3. SVG Bar Chart calculation for Essay Submissions
  const submissionsList = charts?.essaySubmissions || []
  const maxSubmissions = submissionsList.length > 0 ? Math.max(...submissionsList.map(c => c.count)) : 10
  const barChartWidth = 450
  const barChartHeight = 150
  const barPadding = 10
  const barWidth = submissionsList.length > 0
    ? (barChartWidth - 2 * paddingX) / submissionsList.length - barPadding
    : 30

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metrics Summary Grid */}
      <div className="admin-page__stats">
        <div className="admin-stat-card card-base">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="admin-stat-card__value">{metrics.totalUsers || 0}</p>
            <p className="admin-stat-card__label">Tổng người dùng</p>
          </div>
        </div>

        <div className="admin-stat-card card-base">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <span className="material-symbols-outlined">description</span>
          </div>
          <div>
            <p className="admin-stat-card__value">{metrics.totalEssays || 0}</p>
            <p className="admin-stat-card__label">Bài viết đã nộp</p>
          </div>
        </div>

        <div className="admin-stat-card card-base">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <p className="admin-stat-card__value">{metrics.totalClasses || 0}</p>
            <p className="admin-stat-card__label">Lớp học hoạt động</p>
          </div>
        </div>

        <div className="admin-stat-card card-base">
          <div className="admin-stat-card__icon admin-stat-card__icon--purple">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="admin-stat-card__value">{metrics.avgScore || 0} <span style={{ fontSize: '14px', fontWeight: 500 }}>/10</span></p>
            <p className="admin-stat-card__label">Điểm AI trung bình</p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Chart 1: User Growth Line Chart */}
        <div className="admin-card card-base" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>Tăng trưởng tài khoản</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '16px' }}>Đăng ký tài khoản mới theo tuần</p>
          
          {points.length === 0 ? (
            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-outline)' }}>
              Không có dữ liệu đăng ký
            </div>
          ) : (
            <div>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--color-outline-variant)" strokeWidth="1" />

                {/* Area under the line */}
                {areaData && <path d={areaData} fill="url(#growthGrad)" />}

                {/* Main line path */}
                {pathData && <path d={pathData} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />}

                {/* Dots on line */}
                {points.map((p, i) => (
                  <g key={i} className="chart-dot">
                    <circle cx={p.x} cy={p.y} r="4" fill="var(--color-surface-container-lowest)" stroke="var(--color-primary)" strokeWidth="2" />
                    {/* Tooltip hover trigger */}
                    <circle cx={p.x} cy={p.y} r="8" fill="transparent" style={{ cursor: 'pointer' }} />
                    {/* Value text above dot */}
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="var(--color-on-surface)" fontWeight="600">{p.count}</text>
                  </g>
                ))}

                {/* X labels */}
                {points.map((p, i) => (
                  <text key={i} x={p.x} y={chartHeight - 4} textAnchor="middle" fontSize="8" fill="var(--color-outline)">{p.label}</text>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Chart 2: Essay Submission Bar Chart */}
        <div className="admin-card card-base" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>Tần suất nộp bài viết</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '16px' }}>Số lượng bài viết đã submit hàng ngày</p>

          {submissionsList.length === 0 ? (
            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-outline)' }}>
              Không có dữ liệu bài nộp
            </div>
          ) : (
            <div>
              <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} width="100%" height={barChartHeight}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#28a745" />
                    <stop offset="100%" stopColor="#41d866" />
                  </linearGradient>
                </defs>
                <line x1={paddingX} y1={paddingY} x2={barChartWidth - paddingX} y2={paddingY} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={paddingX} y1={barChartHeight / 2} x2={barChartWidth - paddingX} y2={barChartHeight / 2} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={paddingX} y1={barChartHeight - paddingY} x2={barChartWidth - paddingX} y2={barChartHeight - paddingY} stroke="var(--color-outline-variant)" strokeWidth="1" />

                {submissionsList.map((item, index) => {
                  const x = paddingX + index * (barWidth + barPadding) + barPadding / 2
                  const barValHeight = (item.count / maxSubmissions) * (barChartHeight - 2 * paddingY)
                  const y = barChartHeight - paddingY - barValHeight

                  return (
                    <g key={index}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(2, barValHeight)}
                        rx="3"
                        fill="url(#barGrad)"
                      />
                      <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="var(--color-on-surface)" fontWeight="600">{item.count}</text>
                      {/* Shortened date labels */}
                      <text x={x + barWidth / 2} y={barChartHeight - 4} textAnchor="middle" fontSize="7" fill="var(--color-outline)">
                        {item.label.substring(5)}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Roles Distribution & AI Score Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Column 1: Roles breakdown list */}
        <div className="admin-card card-base" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>Cơ cấu tài khoản hệ thống</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '20px' }}>Phần trăm người dùng theo phân quyền</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-label-md" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Học sinh</span>
                <span className="text-label-md" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{studentCount} ({studentPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${studentPct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-label-md" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Giáo viên</span>
                <span className="text-label-md" style={{ color: '#6f42c1', fontWeight: 700 }}>{teacherCount} ({teacherPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${teacherPct}%`, height: '100%', background: '#6f42c1', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-label-md" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Phụ huynh</span>
                <span className="text-label-md" style={{ color: '#fd7e14', fontWeight: 700 }}>{parentCount} ({parentPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${parentPct}%`, height: '100%', background: '#fd7e14', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Score Distribution Progress Bars */}
        <div className="admin-card card-base" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>Phân bố điểm AI chấm</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginBottom: '20px' }}>Số lượng bài viết theo phổ điểm từ 0 đến 10</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(charts?.scoreDistribution || []).map((bucket, index) => {
              const maxBucketCount = Math.max(...(charts?.scoreDistribution || []).map(b => b.count), 1)
              const pct = (bucket.count / maxBucketCount) * 100
              
              // Color depending on range
              let color = 'var(--color-primary)'
              if (bucket.range === '0-2') color = 'var(--color-error)'
              if (bucket.range === '2-4') color = '#fd7e14'
              if (bucket.range === '4-6') color = '#ffc107'
              if (bucket.range === '6-8') color = 'var(--color-primary)'
              if (bucket.range === '8-10') color = '#28a745'

              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="text-label-md" style={{ width: '45px', color: 'var(--color-on-surface)', fontWeight: 600 }}>{bucket.range}</span>
                  <div style={{ flex: 1, height: '12px', background: 'var(--color-surface-container-high)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.4s ease' }} />
                  </div>
                  <span className="text-label-md" style={{ width: '40px', textAlign: 'right', fontWeight: 700, color: 'var(--color-on-surface)' }}>{bucket.count} bài</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
