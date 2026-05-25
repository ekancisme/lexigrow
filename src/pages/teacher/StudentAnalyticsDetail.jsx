import { useNavigate } from 'react-router-dom'
import './StudentAnalyticsDetail.css'

export default function StudentAnalyticsDetail() {
  const navigate = useNavigate()
  const essays = [
    { date: 'Oct 22', title: 'Impact of Automation in Healthcare', words: 1240, ttr: 0.72, score: 7.8 },
    { date: 'Oct 18', title: 'Urbanization & Public Transport', words: 850, ttr: 0.65, score: 6.2 },
    { date: 'Oct 12', title: 'Digital Privacy Concerns', words: 1100, ttr: 0.70, score: 7.5 },
  ]
  return (
    <div className="student-analytics">
      <button className="student-analytics__back" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined">arrow_back</span> Back
      </button>
      <section className="student-analytics__profile card-base">
        <div className="student-analytics__avatar"><span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-primary)' }}>person</span></div>
        <div className="student-analytics__info">
          <h2 className="text-headline-lg">Alex Rivera</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>English 101 - Advanced • C1 Level • Joined Sep 2023</p>
        </div>
        <button className="student-analytics__feedback-btn" onClick={() => navigate('/teacher/feedback/1')}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rate_review</span> Write Feedback
        </button>
      </section>

      <section className="student-analytics__metrics">
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Total Essays</p><p className="text-headline-md">24</p></div>
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Vocabulary Size</p><p className="text-headline-md">525</p></div>
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. TTR</p><p className="text-headline-md">0.72</p></div>
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Growth</p><p className="text-headline-md" style={{ color: 'var(--color-success)' }}>+12%</p></div>
      </section>

      <section className="student-analytics__chart card-base">
        <h3 className="text-title-lg" style={{ marginBottom: 20 }}>Growth Trend</h3>
        <svg viewBox="0 0 800 200" style={{ width: '100%', height: 200 }} preserveAspectRatio="none">
          <defs><linearGradient id="saGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#005bbf" stopOpacity="0.15"/><stop offset="100%" stopColor="#005bbf" stopOpacity="0"/></linearGradient></defs>
          <line x1="0" y1="50" x2="800" y2="50" stroke="#e5eeff" strokeWidth="1"/><line x1="0" y1="100" x2="800" y2="100" stroke="#e5eeff" strokeWidth="1"/><line x1="0" y1="150" x2="800" y2="150" stroke="#e5eeff" strokeWidth="1"/>
          <path d="M0,180 C150,170 250,140 400,110 S600,60 800,30" fill="none" stroke="#005bbf" strokeWidth="3"/>
          <path d="M0,180 C150,170 250,140 400,110 S600,60 800,30 L800,200 L0,200Z" fill="url(#saGrad)"/>
        </svg>
      </section>

      <section className="card-base" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-outline-variant)' }}><h3 className="text-title-lg">Essay History</h3></div>
        <table className="student-analytics__table">
          <thead><tr><th className="text-label-sm">DATE</th><th className="text-label-sm">TITLE</th><th className="text-label-sm">WORDS</th><th className="text-label-sm">TTR</th><th className="text-label-sm">SCORE</th></tr></thead>
          <tbody>{essays.map((e, i) => (
            <tr key={i}><td>{e.date}</td><td style={{ fontWeight: 700 }}>{e.title}</td><td>{e.words}</td><td>{e.ttr}</td><td><span className="student-analytics__score-badge">{e.score}/10</span></td></tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  )
}
