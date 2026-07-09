import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './ClassLeaderboard.css'

export default function ClassLeaderboard({ classId }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true)
        setError('')
        const res = await api.get(`/classes/${classId}/leaderboard`)
        setLeaderboard(res.data || [])
      } catch (err) {
        console.error('Error fetching class leaderboard:', err)
        setError(err.message || 'Failed to load class leaderboard.')
      } finally {
        setLoading(false)
      }
    }
    loadLeaderboard()
  }, [classId])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ color: 'var(--color-outline)' }}>Loading leaderboard rankings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="class-leaderboard__no-data" style={{ padding: '40px 20px', border: '1px solid var(--color-outline-variant)', borderRadius: '12px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-error)' }}>error</span>
        <p style={{ color: 'var(--color-on-surface)', marginTop: '8px' }}>{error}</p>
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className="class-leaderboard__no-data" style={{ padding: '60px 20px', border: '2px dashed var(--color-outline-variant)', borderRadius: '12px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-outline)' }}>emoji_events</span>
        <h4 className="text-title-medium" style={{ marginTop: '12px', fontWeight: 600, color: 'var(--color-on-surface)' }}>No Leaderboard Data Yet</h4>
        <p className="text-body-md" style={{ color: 'var(--color-outline)', marginTop: '4px' }}>
          Add students to this class and submit essays to begin ranking.
        </p>
      </div>
    )
  }

  // Split top 3 and others
  const top3 = leaderboard.slice(0, 3)
  const others = leaderboard.slice(3)

  // Construct visual podium order: [2nd, 1st, 3rd]
  const podiumOrder = []
  if (top3[1]) podiumOrder.push({ ...top3[1], place: '2nd' }) // 2nd place
  if (top3[0]) podiumOrder.push({ ...top3[0], place: '1st' }) // 1st place
  if (top3[2]) podiumOrder.push({ ...top3[2], place: '3rd' }) // 3rd place

  return (
    <div className="class-leaderboard">
      
      {/* Header Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 className="text-title-large" style={{ fontWeight: 700, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#ffd700', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          Weekly Class Leaderboard
        </h3>
        <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
          Rankings are calculated anonymously based on newly accumulated vocabulary and completed essays over the last 7 days.
        </p>
      </div>

      {/* Top 3 Podium Displays */}
      {top3.length > 0 && (
        <div className="class-leaderboard__podium">
          {podiumOrder.map((student) => {
            const is1st = student.place === '1st'
            const is2nd = student.place === '2nd'
            const is3rd = student.place === '3rd'

            let cardClass = 'class-leaderboard__podium-card'
            if (is1st) cardClass += ' class-leaderboard__podium-card--1st'
            if (is2nd) cardClass += ' class-leaderboard__podium-card--2nd'
            if (is3rd) cardClass += ' class-leaderboard__podium-card--3rd'

            let badgeClass = 'class-leaderboard__podium-badge'
            if (is1st) badgeClass += ' class-leaderboard__podium-badge--1st'
            if (is2nd) badgeClass += ' class-leaderboard__podium-badge--2nd'
            if (is3rd) badgeClass += ' class-leaderboard__podium-badge--3rd'

            let iconClass = 'material-symbols-outlined class-leaderboard__podium-icon'
            if (is1st) iconClass += ' class-leaderboard__podium-icon--1st'
            if (is2nd) iconClass += ' class-leaderboard__podium-icon--2nd'
            if (is3rd) iconClass += ' class-leaderboard__podium-icon--3rd'

            return (
              <div key={student.studentId} className={cardClass}>
                <div className={badgeClass}>
                  {student.rank}
                </div>
                <span className={iconClass} style={{ fontVariationSettings: is1st ? "'FILL' 1" : "none" }}>
                  {is1st ? 'crown' : 'workspace_premium'}
                </span>
                <span className="class-leaderboard__podium-name">
                  {student.anonymousNickname}
                  {student.isCurrentUser && <span className="class-leaderboard__user-badge">You</span>}
                </span>
                <div className="class-leaderboard__podium-stats">
                  <span className="class-leaderboard__podium-stat">
                    New Words: <span className="class-leaderboard__podium-stat-val">+{student.vocabAccumulated}</span>
                  </span>
                  <span className="class-leaderboard__podium-stat">
                    Essays: <span className="class-leaderboard__podium-stat-val">{student.essaysCompleted}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ranks 4+ Table List */}
      {others.length > 0 && (
        <div className="class-leaderboard__table-card">
          <table className="class-leaderboard__table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Rank</th>
                <th>Anonymous Student</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Words Accumulated</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Essays Completed</th>
              </tr>
            </thead>
            <tbody>
              {others.map((student) => (
                <tr
                  key={student.studentId}
                  className={student.isCurrentUser ? 'class-leaderboard__row--current' : ''}
                >
                  <td style={{ fontWeight: 700, paddingLeft: '24px' }}>#{student.rank}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>{student.anonymousNickname}</span>
                      {student.isCurrentUser && <span className="class-leaderboard__user-badge">You</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)' }}>
                    +{student.vocabAccumulated}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {student.essaysCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
