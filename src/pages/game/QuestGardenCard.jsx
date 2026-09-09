import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'

export default function QuestGardenCard({ garden = false }) {
  const { t } = useLanguage()
  const [summary, setSummary] = useState(null)
  const [failed, setFailed] = useState(false)

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
  const solvedCount = summary?.solvedCount ?? 6
  const totalCount = summary?.totalWords ?? 10
  const percent = Math.min(100, Math.round((solvedCount / totalCount) * 100))

  return (
    <section className="quest-garden-banner" aria-label={t('quest.title', 'Daily Word Quest')}>
      <div className="quest-banner-content">
        {/* Left Side: Icon & Copy */}
        <div className="quest-banner-left">
          <div className="quest-banner-icon">
            <span className="material-symbols-outlined">{garden ? 'emoji_nature' : 'psychology'}</span>
            <span className="quest-banner-icon__ping" />
          </div>

          <div className="quest-banner-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="hero-tag" style={{ margin: 0 }}>
                <span className="hero-tag__dot" />
                {t('quest.dailyBadge', 'DAILY VOCABULARY QUEST')}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                · {t('quest.dayStatus', `Day 3 of 30 · ${percent}% Solved`)}
              </span>
            </div>

            <h3>{t(garden ? 'quest.fireflyGarden' : 'quest.title', '🌱 Quest Garden (Daily Crossword)')}</h3>
            <p>
              {t(
                'quest.crosswordDesc',
                "Complete today's word puzzle to earn fireflies & sprout rare flowers. Discover Latin roots and lexical synonyms in contextual crossword grids."
              )}
            </p>

            {/* Sprout Progress Bar Gauge */}
            <div className="sprout-progress-box">
              <div className="sprout-progress-labels">
                <span>
                  Sprout Progress: <strong>{solvedCount} / {totalCount} Clues Solved</strong>
                </span>
                <span style={{ color: 'var(--color-success, #16A34A)', fontWeight: 700 }}>+120 Firefly XP</span>
              </div>
              <div className="sprout-progress-track">
                <div className="sprout-progress-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Play Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-success, #16A34A)' }}>grade</span>
            <span>Reward: +80 XP & 1 Sprout</span>
          </div>
          <Link
            className="arcade-btn-3d arcade-btn--tertiary"
            to="/student/game/daily-quest"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <span>
              {t(
                rawStatus === 'completed'
                  ? 'quest.viewResult'
                  : rawStatus === 'playing' || rawStatus === 'in_progress'
                    ? 'quest.continue'
                    : 'quest.playNow',
                'Play Now'
              )}
            </span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
