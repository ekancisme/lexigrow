import './VocabGrowthChart.css'

export default function VocabGrowthChart({ title = 'Vocabulary Growth', activeTab = 'Weekly' }) {
  return (
    <div className="vocab-chart card-base">
      <div className="vocab-chart__header">
        <h3 className="text-title-lg">{title}</h3>
        <div className="vocab-chart__tabs">
          <button className={`vocab-chart__tab ${activeTab === 'Weekly' ? 'vocab-chart__tab--active' : ''}`}>
            Weekly
          </button>
          <button className={`vocab-chart__tab ${activeTab === 'Monthly' ? 'vocab-chart__tab--active' : ''}`}>
            Monthly
          </button>
        </div>
      </div>
      <div className="vocab-chart__body">
        <svg className="vocab-chart__svg" viewBox="0 0 800 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#005bbf" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#005bbf" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="0" y1="50" x2="800" y2="50" stroke="#e5eeff" strokeWidth="1" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="#e5eeff" strokeWidth="1" />
          <line x1="0" y1="150" x2="800" y2="150" stroke="#e5eeff" strokeWidth="1" />
          {/* Line */}
          <path
            d="M0,180 Q100,160 200,170 T400,120 T600,100 T800,40"
            fill="none"
            stroke="#005bbf"
            strokeWidth="3"
            className="vocab-chart__line"
          />
          {/* Fill */}
          <path
            d="M0,180 Q100,160 200,170 T400,120 T600,100 T800,40 L800,200 L0,200 Z"
            fill="url(#chartGradient)"
            className="vocab-chart__area"
          />
          {/* End point */}
          <circle cx="800" cy="40" r="6" fill="#005bbf" />
          <circle cx="800" cy="40" r="10" fill="white" fillOpacity="0.5" stroke="#005bbf" strokeWidth="2" />
        </svg>
        <div className="vocab-chart__labels">
          <span>Sept 10</span>
          <span>Sept 24</span>
          <span>Oct 08</span>
          <span>Oct 24 (Today)</span>
        </div>
      </div>
    </div>
  )
}
