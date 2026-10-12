import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import gsap from 'gsap'
import './ArcadeCommon.css'
import './GameHub.css'
import QuestGardenCard from './QuestGardenCard.jsx'

export default function GameHub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const cardsRef = useRef([])

  const [overview, setOverview] = useState(null)
  const [questSummary, setQuestSummary] = useState(null)
  const [experience, setExperience] = useState(null)
  const [weeklyRank, setWeeklyRank] = useState(null)
  const [streakData, setStreakData] = useState({ streakDays: user?.streakDays || 0 })

  useEffect(() => {
    async function loadHubStats() {
      try {
        const [overviewRes, questRes, streakRes, experienceRes, leaderboardRes] = await Promise.allSettled([
          api.get('/progress/overview'),
          api.get('/daily-quests/summary'),
          api.get('/progress/streak'),
          api.get('/progress/experience'),
          api.get('/progress/leaderboard?scope=global')
        ])

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value?.data || null)
        if (questRes.status === 'fulfilled') setQuestSummary(questRes.value?.data || null)
        if (streakRes.status === 'fulfilled') setStreakData(streakRes.value?.data || { streakDays: user?.streakDays || 0 })
        if (experienceRes.status === 'fulfilled') setExperience(experienceRes.value?.data?.data || experienceRes.value?.data || null)
        if (leaderboardRes.status === 'fulfilled') setWeeklyRank(leaderboardRes.value?.data?.data?.currentRank || null)
      } catch (err) {
        console.error('Error loading GameHub stats:', err)
      }
    }
    loadHubStats()
  }, [user])

  useEffect(() => {
    if (cardsRef.current.length > 0) {
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 30, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out'
        }
      )
    }
  }, [])

  const currentStreak = streakData.streakDays || user?.streakDays || 0
  const totalVocab = overview?.totalVocab || 0
  const earnedXP = experience?.totalXp || 0

  const userRank = overview?.rank || 'A1'
  const solvedQuest = questSummary?.solved || 0
  const totalQuest = questSummary?.total || 6
  const questPercent = totalQuest > 0 ? Math.min(100, Math.round((solvedQuest / totalQuest) * 100)) : 0

  const games = [
    {
      id: 'hunter',
      title: t('games.hunterTitle', '🎯 Vocab Hunter'),
      category: t('games.hunterCategory', 'Arcade Reflex'),
      stat: `${totalVocab} ${t('common.words', 'Words Pool')}`,
      statIcon: 'military_tech',
      subtitle: t('games.hunterSubtitle', 'Speed Drills · 90s Time Attack'),
      description: t('games.hunterDesc', 'Pop falling bubbles before they hit danger zone! Speed reading & target definition reflex testing lexical rapid-recall.'),
      featureLeft: 'Target speed: 45 WPM',
      featureRight: t('games.xpPracticeOnly', 'Practice only · no XP reward'),
      icon: 'sports_esports',
      cardClass: 'arcade-card--hunter',
      btnClass: 'arcade-btn--hunter',
      path: '/student/game/hunter'
    },
    {
      id: 'filler',
      title: t('games.fillerTitle', '📝 Context Filler'),
      category: t('games.fillerCategory', 'Editorial Practice'),
      stat: `TTR ${Math.round((overview?.avgTTR || 0.6) * 100)}%`,
      statIcon: 'grade',
      subtitle: t('games.fillerSubtitle', 'Literature & News Cloze Drills'),
      description: t('games.fillerDesc', 'Read authentic sentences from literature & news, choose the missing vocabulary in context with syntactic accuracy.'),
      featureLeft: '"Her lexical precision was ___."',
      featureRight: t('games.xpPracticeOnly', 'Practice only · no XP reward'),
      icon: 'psychology',
      cardClass: 'arcade-card--filler',
      btnClass: 'arcade-btn--filler',
      path: '/student/game/filler'
    },
    {
      id: 'scramble',
      title: t('games.scrambleTitle', '🔤 Word Scramble'),
      category: t('games.scrambleCategory', 'Spelling & IPA'),
      stat: `Tier: ${userRank}`,
      statIcon: 'explore',
      subtitle: t('games.scrambleSubtitle', 'Phonetic Transcription & Anagrams'),
      description: t('games.scrambleDesc', 'Rearrange scrambled letters with phonetic IPA, definitions, and spelling hints to unlock root etymologies.'),
      featureLeft: 'Phonetic IPA clues',
      featureRight: t('games.xpPracticeOnly', 'Practice only · no XP reward'),
      icon: 'spellcheck',
      cardClass: 'arcade-card--scramble',
      btnClass: 'arcade-btn--scramble',
      path: '/student/game/scramble'
    },
    {
      id: 'matching',
      title: t('games.matchingTitle', '🧩 Word Matching'),
      category: t('games.matchingCategory', 'Memory 3D'),
      stat: `${totalVocab > 8 ? 'Active 4x4' : 'Active 2x3'}`,
      statIcon: 'military_tech',
      subtitle: t('games.matchingSubtitle', 'Pairs Flip & Semantic Association'),
      description: t('games.matchingDesc', '3D memory card flip challenge. Match advanced target words with their exact definitions and usage nuances under pressure.'),
      featureLeft: '16 Cards · Grid 4x4',
      featureRight: t('games.xpPracticeOnly', 'Practice only · no XP reward'),
      icon: 'extension',
      cardClass: 'arcade-card--matching',
      btnClass: 'arcade-btn--matching',
      path: '/student/game/matching'
    }
  ]

  return (
    <div className="game-hub-page animate-fade-in">
      {/* Background Ambience / Glow Orbs */}
      <div className="game-hub-ambient" aria-hidden="true">
        <div className="ambient-orb ambient-orb--blue" />
        <div className="ambient-orb ambient-orb--green" />
      </div>

      <div className="game-hub-container">
        {/* Top Navigation & Player HUD Row */}
        <header className="game-hub-topbar">
          <button
            className="game-hub-back-btn"
            onClick={() => navigate('/student/vocabulary')}
            title={t('games.returnToLibrary')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>{t('games.wordLibrary', 'Word Library')}</span>
          </button>

          {/* Player Stats HUD Pills */}
          <div className="game-hub-hud">
            <div className="hud-pill hud-pill--streak" title={`${currentStreak}-Day Streak`}>
              <span className="material-symbols-outlined hud-pill__icon">local_fire_department</span>
              <span>{currentStreak} <span className="hud-pill__label">{t('dashboard.streak', 'Days')}</span></span>
            </div>

            <div className="hud-pill hud-pill--xp" title={t('games.totalExperience', 'Total experience earned')}>
              <span className="material-symbols-outlined hud-pill__icon">grade</span>
              <span>{earnedXP.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} <span className="hud-pill__label">XP</span></span>
            </div>

            <div className="hud-pill hud-pill--hearts" title={t('games.lifeEnergy', { count: '5/5' })}>
              <span className="material-symbols-outlined hud-pill__icon">favorite</span>
              <span>5/5</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="game-hub-hero">
          <div>
            <div className="hero-tag">
              <span className="hero-tag__dot" />
              <span>{t('games.playerLevel', 'Level')} {experience?.level || 1} · {userRank} {t('games.cefrLevel', 'English level')}</span>
            </div>
            <div className="hero-title-row">
              <h1 className="hero-title">{t('games.hubTitle', 'LexiGrow Play Zone')}</h1>
              <span className="hero-badge-pro">PRO PLAY</span>
            </div>
            <p className="hero-desc">
              {t('games.hubSubtitle', 'Sharpen vocabulary retention, master phonetics, and unlock linguistic mastery through tactile arcade drills.')}
            </p>
          </div>

          {/* Verified weekly ranking and level */}
          <button className="hero-league-widget" type="button" onClick={() => navigate('/student/progress?tab=leaderboard')} style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
            <div className="league-icon-box">
              <span className="material-symbols-outlined">leaderboard</span>
            </div>
            <div className="league-meta">
              <div className="league-meta__tier">{t('games.weeklyRanking', 'Weekly ranking')}</div>
              <div className="league-meta__rank">
                {weeklyRank ? `#${weeklyRank}` : t('games.notRankedYet', 'Not ranked yet')}
              </div>
            </div>
          </button>
        </section>

        {/* FEATURED BANNER: Quest Garden (Daily Crossword) */}
        <QuestGardenCard />

        {/* 4 Specialized Arcade Arena Cards */}
        <section>
          <div className="arcade-section-header">
            <h3>
              <span>{t('games.arcadeArenaModes')}</span>
              <span className="arcade-count-chip">{t('games.availableModes')}</span>
            </h3>
            <p>{t('games.selectModeDesc')}</p>
          </div>

          <div className="arcade-cards-grid">
            {games.map((game, idx) => (
              <div
                key={game.id}
                ref={(el) => (cardsRef.current[idx] = el)}
                className={`arcade-game-card ${game.cardClass}`}
              >
                {/* Background Ambient Glow */}
                <div className="card-ambient-glow" />

                <div>
                  {/* Category Tag & High Score */}
                  <div className="card-meta-row">
                    <span className="card-category-tag">
                      <span className="card-category-tag__dot" />
                      {game.category}
                    </span>
                    <span className="card-stat-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{game.statIcon}</span>
                      {game.stat}
                    </span>
                  </div>

                  {/* Header Title & Anchor Icon */}
                  <div className="card-header-group">
                    <div className="card-icon-anchor">
                      <span className="material-symbols-outlined">{game.icon}</span>
                    </div>
                    <div className="card-title-text">
                      <h4>{game.title}</h4>
                      <div className="card-subtitle">{game.subtitle}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="card-body-desc">{game.description}</p>

                  {/* Feature Pill */}
                  <div className="card-feature-pill">
                    <span style={{ color: 'var(--color-on-surface)' }}>{game.featureLeft}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{game.featureRight}</span>
                  </div>
                </div>

                {/* Tactile 3D Extruded Action Button */}
                <button
                  className={`arcade-btn-3d ${game.btnClass}`}
                  onClick={() => navigate(game.path)}
                >
                  <span>{t('games.playNow', 'Play Now')}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Achievement & Daily Goal Strip */}
        <section className="game-hub-bottom-strip">
          {/* Daily Goal */}
          <div className="bottom-strip-item">
            <div className="strip-item-icon strip-item-icon--blue">
              <span className="material-symbols-outlined">sports_esports</span>
            </div>
            <div className="strip-item-info">
              <span className="strip-item-label">{t('games.dailyQuestGoal')}</span>
              <div className="strip-item-value">{t('games.wordsSolved', { solved: solvedQuest, total: totalQuest })}</div>
              <div className="strip-item-track">
                <div className="strip-item-fill" style={{ width: `${questPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Verified weekly XP */}
          <div className="bottom-strip-item">
            <div className="strip-item-icon strip-item-icon--purple">
              <span className="material-symbols-outlined">grade</span>
            </div>
            <div className="strip-item-info">
              <span className="strip-item-label">{t('games.weeklyExperience', 'Experience this week')}</span>
              <div className="strip-item-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>{(experience?.weeklyXp || 0).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} XP</span>
              </div>
            </div>
          </div>

          {/* Current level */}
          <div className="bottom-strip-item">
            <div className="strip-item-icon strip-item-icon--green">
              <span className="material-symbols-outlined">military_tech</span>
            </div>
            <div className="strip-item-info">
              <span className="strip-item-label">{t('games.currentLevel', 'Current level')}</span>
              <div className="strip-item-value">{t('games.level', 'Level')} {experience?.level || 1} · {earnedXP.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} XP</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
