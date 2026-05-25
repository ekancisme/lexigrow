import { useNavigate } from 'react-router-dom'
import './ClassOverview.css'

const students = [
  { name: 'Alex Rivera', level: 'C1', essays: 24, ttr: 0.72, growth: '+12%', status: 'growing' },
  { name: 'Maria Chen', level: 'B2', essays: 18, ttr: 0.65, growth: '+8%', status: 'growing' },
  { name: 'John Doe', level: 'B2', essays: 12, ttr: 0.55, growth: '-5%', status: 'declining' },
  { name: 'Sarah Smith', level: 'C1', essays: 20, ttr: 0.78, growth: '+15%', status: 'growing' },
  { name: 'James Park', level: 'B1', essays: 8, ttr: 0.48, growth: '0%', status: 'stagnating' },
]

export default function ClassOverview() {
  const navigate = useNavigate()
  return (
    <div className="class-overview">
      <section className="class-overview__header">
        <div>
          <button className="class-overview__back" onClick={() => navigate('/teacher/dashboard')}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
          <h2 className="text-headline-lg" style={{ marginTop: 8 }}>English 101 - Advanced</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>22 students • Avg TTR: 0.68 • Started Sep 1, 2023</p>
        </div>
      </section>

      <section className="class-overview__metrics">
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. Words/Essay</p><p className="text-headline-md">1,120</p></div>
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. New Words/Week</p><p className="text-headline-md">14.5</p></div>
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Class TTR</p><p className="text-headline-md">0.68</p></div>
        <div className="card-base"><p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Completion Rate</p><p className="text-headline-md">82%</p></div>
      </section>

      <section className="card-base" style={{ padding: 0 }}>
        <div className="class-overview__table-header">
          <h3 className="text-title-lg">Student Roster</h3>
          <input type="text" className="class-overview__search" placeholder="Search students..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="class-overview__table">
            <thead><tr>
              <th className="text-label-sm">STUDENT</th><th className="text-label-sm">LEVEL</th>
              <th className="text-label-sm">ESSAYS</th><th className="text-label-sm">TTR</th>
              <th className="text-label-sm">GROWTH</th><th className="text-label-sm">STATUS</th>
              <th className="text-label-sm">ACTION</th>
            </tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} onClick={() => navigate(`/teacher/student/${i + 1}`)}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td><td>{s.level}</td>
                  <td>{s.essays}</td><td>{s.ttr}</td>
                  <td style={{ color: s.growth.startsWith('+') ? 'var(--color-success)' : s.growth.startsWith('-') ? 'var(--color-error)' : 'var(--color-outline)' }}>{s.growth}</td>
                  <td><span className={`class-overview__status class-overview__status--${s.status}`}>{s.status}</span></td>
                  <td><button className="class-overview__action-btn">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
