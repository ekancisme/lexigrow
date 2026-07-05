import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './VocabGrowthChart.css'

export default function VocabGrowthChart({ title = 'Vocabulary Growth', activeTab = 'Weekly' }) {
  const [tab, setTab] = useState(activeTab)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const periodParam = tab === 'Monthly' ? 'monthly' : 'weekly'
        const res = await api.get(`/vocabulary/growth?period=${periodParam}`)
        if (res.success && res.data) {
          setChartData(res.data)
        } else {
          setChartData([])
        }
      } catch (err) {
        console.error('Error loading growth chart:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tab])

  // Calculate SVG paths based on chartData
  const maxVal = Math.max(...chartData.map(d => d.count), 1)
  const points = chartData.map((d, index) => {
    const x = chartData.length > 1 ? (index / (chartData.length - 1)) * 800 : 400
    const y = 170 - (d.count / maxVal) * 130
    return { x, y }
  })

  // Generate cubic/quadratic curve or straight line paths
  const linePath = points.length > 0
    ? points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')
    : 'M 0,150 L 800,150'

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},200 L ${points[0].x},200 Z`
    : 'M 0,150 L 800,150 L 800,200 L 0,200 Z'

  const endPoint = points.length > 0 ? points[points.length - 1] : { x: 800, y: 150 }

  return (
    <div className="vocab-chart card-base">
      <div className="vocab-chart__header">
        <h3 className="text-title-lg">{title}</h3>
        <div className="vocab-chart__tabs">
          <button 
            className={`vocab-chart__tab ${tab === 'Weekly' ? 'vocab-chart__tab--active' : ''}`}
            onClick={() => setTab('Weekly')}
          >
            Weekly
          </button>
          <button 
            className={`vocab-chart__tab ${tab === 'Monthly' ? 'vocab-chart__tab--active' : ''}`}
            onClick={() => setTab('Monthly')}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="vocab-chart__body">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: 'var(--color-outline)' }}>
            <span className="material-symbols-outlined animate-spin" style={{ marginRight: 8 }}>progress_activity</span>
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <svg className="vocab-chart__svg" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="50" x2="800" y2="50" stroke="var(--color-surface-container)" strokeWidth="1" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="var(--color-surface-container)" strokeWidth="1" />
              <line x1="0" y1="150" x2="800" y2="150" stroke="var(--color-surface-container)" strokeWidth="1" />
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                className="vocab-chart__line"
              />
              {/* Fill */}
              <path
                d={areaPath}
                fill="url(#chartGradient)"
                className="vocab-chart__area"
              />
              {/* End point */}
              <circle cx={endPoint.x} cy={endPoint.y} r="6" fill="var(--color-primary)" />
              <circle cx={endPoint.x} cy={endPoint.y} r="10" fill="white" fillOpacity="0.5" stroke="var(--color-primary)" strokeWidth="2" />
            </svg>
            <div className="vocab-chart__labels">
              {chartData.map((d, index) => (
                <span key={index}>{d.label}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
