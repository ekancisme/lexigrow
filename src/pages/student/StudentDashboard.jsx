import StatCard from '../../components/common/StatCard'
import CircularProgress from '../../components/common/CircularProgress'
import VocabGrowthChart from '../../components/charts/VocabGrowthChart'
import './StudentDashboard.css'

const recentSubmissions = [
  { date: 'Oct 22, 2023', title: 'Impact of Automation in Healthcare', words: '1,240', newLexis: '+12', complexity: '7.8/10', status: 'Submitted' },
  { date: 'Oct 18, 2023', title: 'Urbanization & Public Transport', words: '850', newLexis: '+6', complexity: '6.2/10', status: 'Submitted' },
  { date: 'Oct 24, 2023', title: 'Sustainable Architecture Trends', words: '420', newLexis: '--', complexity: '8.1/10', status: 'Draft' },
]

export default function StudentDashboard() {
  return (
    <div className="student-dash">
      {/* Welcome */}
      <section className="student-dash__welcome">
        <h2 className="text-headline-lg">Welcome back, Alex</h2>
        <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
          Today is Tuesday, October 24th. You've reached 85% of your weekly vocabulary goal.
        </p>
      </section>

      {/* Stat Cards */}
      <section className="student-dash__stats">
        <StatCard label="Total Essays" value="24" subtitle="+2 since last month" icon="description" />
        <StatCard label="New Words" value="+18" trend="This Week" icon="trending_up" />
        <StatCard label="TTR Score" value="0.72" icon="analytics" progress={72} />
        <StatCard
          label="Complexity"
          value={<>7.5<span className="text-body-md" style={{ color: 'var(--color-outline)' }}>/10</span></>}
          subtitle="Linguistic Density: High"
          icon="equalizer"
        />
      </section>

      {/* Charts & Goals */}
      <section className="student-dash__charts">
        <div className="student-dash__chart-main">
          <VocabGrowthChart />
        </div>
        <div className="student-dash__goals card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Weekly Goals</h3>
          <div className="student-dash__goals-list">
            <CircularProgress percentage={80} color="primary" label="New Words" sublabel="16 of 20 target" />
            <CircularProgress percentage={65} color="secondary" label="Writing Length" sublabel="3,250 of 5,000 words" />
            <CircularProgress percentage={90} color="tertiary" label="Complexity Rank" sublabel="Exceeding Tier 2 average" />
          </div>
        </div>
      </section>

      {/* Recent Submissions */}
      <section className="student-dash__table card-base" style={{ padding: 0 }}>
        <div className="student-dash__table-header">
          <h3 className="text-title-lg">Recent Submissions</h3>
          <button className="student-dash__view-all">View All</button>
        </div>
        <div className="student-dash__table-wrap">
          <table className="student-dash__submissions">
            <thead>
              <tr>
                <th className="text-label-sm">DATE</th>
                <th className="text-label-sm">TITLE</th>
                <th className="text-label-sm">WORDS</th>
                <th className="text-label-sm">NEW LEXIS</th>
                <th className="text-label-sm">COMPLEXITY</th>
                <th className="text-label-sm">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((item, i) => (
                <tr key={i}>
                  <td className="text-body-md">{item.date}</td>
                  <td className="student-dash__essay-title">{item.title}</td>
                  <td className="text-body-md">{item.words}</td>
                  <td className="text-body-md" style={{ color: item.newLexis !== '--' ? 'var(--color-primary)' : 'var(--color-outline)' }}>{item.newLexis}</td>
                  <td>
                    <span className="student-dash__complexity-badge">{item.complexity}</span>
                  </td>
                  <td>
                    <span className={`student-dash__status-badge ${item.status === 'Draft' ? 'student-dash__status-badge--draft' : ''}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
