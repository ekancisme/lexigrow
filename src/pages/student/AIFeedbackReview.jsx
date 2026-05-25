import './AIFeedbackReview.css'

const feedbackData = {
  title: 'Impact of Automation in Healthcare',
  date: 'Oct 22, 2023',
  overallScore: 7.8,
  scores: [
    { label: 'Vocabulary Diversity (TTR)', score: 0.72, max: 1 },
    { label: 'Grammar Accuracy', score: 8.5, max: 10 },
    { label: 'Coherence & Flow', score: 7.2, max: 10 },
    { label: 'Complexity Index', score: 7.8, max: 10 },
  ],
  newWords: ['ameliorate', 'paradigm', 'ubiquitous', 'streamline', 'efficacy', 'interoperability', 'scalable', 'telemedicine', 'prognostic', 'algorithmic', 'infrastructure', 'implementation'],
  suggestions: [
    { type: 'improvement', text: 'Consider using more transition words between paragraphs to improve coherence.' },
    { type: 'strength', text: 'Excellent use of domain-specific terminology related to healthcare automation.' },
    { type: 'improvement', text: 'The conclusion could be strengthened by restating the thesis more explicitly.' },
    { type: 'strength', text: 'Good variety in sentence structure with mix of simple and complex sentences.' },
  ]
}

export default function AIFeedbackReview() {
  return (
    <div className="ai-feedback">
      <section className="ai-feedback__header">
        <div>
          <h2 className="text-headline-lg">AI Feedback Review</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {feedbackData.title} — {feedbackData.date}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ai-feedback__btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export
          </button>
          <button className="ai-feedback__btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
            Revise Essay
          </button>
        </div>
      </section>

      <div className="ai-feedback__layout">
        {/* Main Scores */}
        <div className="ai-feedback__main">
          {/* Overall Score */}
          <div className="ai-feedback__overall card-base">
            <div className="ai-feedback__score-ring">
              <svg width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-surface-container)" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-primary)" strokeWidth="8"
                  strokeDasharray={314} strokeDashoffset={314 - (feedbackData.overallScore / 10) * 314}
                  strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="ai-feedback__score-value">
                <span className="text-headline-lg">{feedbackData.overallScore}</span>
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>/10</span>
              </div>
            </div>
            <div>
              <h3 className="text-title-lg">Overall Score</h3>
              <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Above average for C1 level</p>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 20 }}>Detailed Analysis</h3>
            <div className="ai-feedback__scores">
              {feedbackData.scores.map((s, i) => (
                <div key={i} className="ai-feedback__score-item">
                  <div className="ai-feedback__score-label">
                    <span className="text-label-md">{s.label}</span>
                    <span className="text-data-mono">{s.score}/{s.max}</span>
                  </div>
                  <div className="ai-feedback__score-bar">
                    <div className="ai-feedback__score-fill" style={{ width: `${(s.score / s.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 20 }}>AI Suggestions</h3>
            <div className="ai-feedback__suggestions">
              {feedbackData.suggestions.map((s, i) => (
                <div key={i} className={`ai-feedback__suggestion ai-feedback__suggestion--${s.type}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {s.type === 'strength' ? 'thumb_up' : 'lightbulb'}
                  </span>
                  <p className="text-body-md">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side: New Words */}
        <div className="ai-feedback__side">
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', marginRight: 8 }}>auto_awesome</span>
              New Words Detected
            </h3>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 16 }}>{feedbackData.newWords.length} new words added to your library</p>
            <div className="ai-feedback__words">
              {feedbackData.newWords.map((w, i) => (
                <span key={i} className="ai-feedback__word-chip">{w}</span>
              ))}
            </div>
          </div>

          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Writing Stats</h3>
            <div className="ai-feedback__writing-stats">
              <div className="ai-feedback__wstat"><span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Word Count</span><span className="text-data-mono">1,240</span></div>
              <div className="ai-feedback__wstat"><span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Paragraphs</span><span className="text-data-mono">6</span></div>
              <div className="ai-feedback__wstat"><span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. Sentence Length</span><span className="text-data-mono">18 words</span></div>
              <div className="ai-feedback__wstat"><span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Unique Words</span><span className="text-data-mono">342</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
