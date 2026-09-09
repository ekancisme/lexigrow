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
  return (
    <section className="quest-banner" aria-label={t('quest.title')}>
      <div className="quest-lantern" aria-hidden="true">
        <span className="material-symbols-outlined">{garden ? 'emoji_nature' : 'grid_on'}</span>
      </div>
      <div className="quest-banner-copy">
        <span className="quest-eyebrow">{t(garden ? 'quest.collection' : 'quest.daily')}</span>
        <h2>{t(garden ? 'quest.fireflyGarden' : 'quest.title')}</h2>
        <p>{t(garden ? 'quest.collectionDescription' : 'quest.subtitle')}</p>
        <small aria-live="polite">
          {failed
            ? t('quest.summaryError')
            : summary
              ? garden
                ? `${summary.fireflies} ${t('quest.fireflies')}`
                : t(`quest.status.${summary.status}`)
              : t('quest.loading')}
        </small>
        {garden && summary?.fireflies > 0 && (
          <div className="quest-fireflies" aria-hidden="true">
            {Array.from({ length: Math.min(summary.fireflies, 12) }, (_, i) => (
              <span key={i}>✦</span>
            ))}
          </div>
        )}
      </div>
      <Link className="quest-primary" to="/student/game/daily-quest">
        {t(
          summary?.status === 'completed'
            ? 'quest.viewResult'
            : summary?.status === 'playing'
              ? 'quest.continue'
              : 'quest.start',
        )}
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}
