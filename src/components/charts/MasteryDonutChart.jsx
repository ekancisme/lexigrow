import { useNavigate } from 'react-router-dom'
import './MasteryDonutChart.css'

export default function MasteryDonutChart({ distribution, title = 'Vocabulary Mastery' }) {
  const navigate = useNavigate()

  const { new: newCount = 0, learning = 0, mastered = 0 } = distribution || {}
  const total = newCount + learning + mastered

  // Calculate percentages
  const newPct = total > 0 ? Math.round((newCount / total) * 100) : 0
  const learningPct = total > 0 ? Math.round((learning / total) * 100) : 0
  const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0

  // SVG parameters for donut chart (Radius = 50, Circumference = 314.16)
  const radius = 50
  const circ = 2 * Math.PI * radius // ~314.159
  const strokeWidth = 14

  // Calculate stroke-dasharray offsets (each segment should only draw its own percentage)
  const masteredOffset = circ - (masteredPct / 100) * circ
  const learningOffset = circ - (learningPct / 100) * circ
  const newOffset = circ - (newPct / 100) * circ

  return (
    <div className="mastery-donut card-base">
      <h3 className="text-title-lg mastery-donut__title">{title}</h3>
      
      <div className="mastery-donut__content">
        {total === 0 ? (
          <div className="mastery-donut__empty">
            <span className="material-symbols-outlined">menu_book</span>
            <p>No words in your library yet.</p>
          </div>
        ) : (
          <>
            {/* SVG Donut */}
            <div className="mastery-donut__chart-container">
              <svg className="mastery-donut__svg" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="var(--color-surface-container)"
                  strokeWidth={strokeWidth}
                />
                {/* Mastered Segment (Green) */}
                {mastered > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-success)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circ}
                    strokeDashoffset={masteredOffset}
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                )}
                {/* Learning Segment (Orange) */}
                {learning > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-warning)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circ}
                    strokeDashoffset={learningOffset}
                    transform={`rotate(${((masteredPct / 100) * 360) - 90} 70 70)`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                )}
                {/* New Segment (Blue) */}
                {newCount > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-primary)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circ}
                    strokeDashoffset={newOffset}
                    transform={`rotate(${((masteredPct + learningPct) / 100) * 360 - 90} 70 70)`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                )}
              </svg>
              <div className="mastery-donut__center-text">
                <span className="mastery-donut__center-num">{total}</span>
                <span className="mastery-donut__center-label">words</span>
              </div>
            </div>

            {/* Legend & Stats */}
            <div className="mastery-donut__legend">
              <div className="mastery-donut__legend-item">
                <span className="mastery-donut__dot mastery-donut__dot--new" />
                <span className="mastery-donut__legend-label">New</span>
                <span className="mastery-donut__legend-val">{newCount} ({newPct}%)</span>
              </div>
              <div className="mastery-donut__legend-item">
                <span className="mastery-donut__dot mastery-donut__dot--learning" />
                <span className="mastery-donut__legend-label">Learning</span>
                <span className="mastery-donut__legend-val">{learning} ({learningPct}%)</span>
              </div>
              <div className="mastery-donut__legend-item">
                <span className="mastery-donut__dot mastery-donut__dot--mastered" />
                <span className="mastery-donut__legend-label">Mastered</span>
                <span className="mastery-donut__legend-val">{mastered} ({masteredPct}%)</span>
              </div>

              {/* Review Button inside Widget */}
              {(newCount > 0 || learning > 0) && (
                <button
                  className="mastery-donut__review-btn"
                  onClick={() => navigate('/student/vocabulary/review')}
                >
                  <span>Start Review</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
