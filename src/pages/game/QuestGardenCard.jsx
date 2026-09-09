import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import './DailyWordQuest.css'

export default function QuestGardenCard({ garden = false }) {
  const { t } = useLanguage()
  const [summary, setSummary] = useState(null),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    api
      .get('/daily-quests/summary')
      .then(({ data }) => {
        if (active) setSummary(data)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [])

  const rawStatus = summary?.status || 'new'
  const statusLabel = failed
    ? t('quest.summaryError', 'Unable to load status')
    : garden && summary
      ? `${summary.fireflies || 0} ${t('quest.fireflies', 'Fireflies')}`
      : t(`quest.status.${rawStatus}`, rawStatus === 'completed' ? 'Completed' : 'Ready to play')

  return (
    <section className="quest-banner" aria-label={t('quest.title', 'Daily Word Quest')}>
      <div className="quest-lantern" aria-hidden="true">
        <span className="material-symbols-outlined">{garden ? 'emoji_nature' : 'grid_on'}</span>
      </div>
      <div className="quest-banner-copy">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="quest-eyebrow">{t(garden ? 'quest.collection' : 'quest.daily', 'Daily Challenge')}</span>
          <span className={`quest-status-badge quest-status-badge--${rawStatus}`}>
            {statusLabel}
          </span>
        </div>
        <h3>{t(garden ? 'quest.fireflyGarden' : 'quest.title', 'Daily Word Quest')}</h3>
        <p>{t(garden ? 'quest.collectionDescription' : 'quest.subtitle', 'Fill in the daily vocabulary crossword to earn garden fireflies and XP.')}</p>
        {garden && summary?.fireflies > 0 && (
          <div className="quest-fireflies" aria-hidden="true">
            {Array.from({ length: Math.min(summary.fireflies, 12) }, (_, i) => (
              <span key={i}>✦</span>
            ))}
          </div>
        )}
      </div>
      <Link className="play-game-btn matching-theme" to="/student/game/daily-quest" style={{ flexShrink: 0, textDecoration: 'none' }}>
        {t(
          summary?.status === 'completed'
            ? 'quest.viewResult'
            : summary?.status === 'playing' || summary?.status === 'in_progress'
              ? 'quest.continue'
              : 'quest.start',
          'Start Quest'
        )}
        <span className="material-symbols-outlined">arrow_forward</span>
      </Link>
    </section>
  )
}
