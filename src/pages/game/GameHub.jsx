import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import gsap from 'gsap'
import './GameHub.css'
import QuestGardenCard from './QuestGardenCard.jsx'

export default function GameHub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const cardsRef = useRef([])

  const [overview, setOverview] = useState(null)
  const [questSummary, setQuestSummary] = useState(null)
  const [streakData, setStreakData] = useState({ streakDays: user?.streakDays || 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHubStats() {
      try {
        setLoading(true)
        const [overviewRes, questRes, streakRes] = await Promise.allSettled([
          api.get('/progress/overview'),
          api.get('/daily-quests/summary'),
          api.get('/progress/streak')
        ])

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value?.data || null)
        if (questRes.status === 'fulfilled') setQuestSummary(questRes.value?.data || null)
        if (streakRes.status === 'fulfilled') setStreakData(streakRes.value?.data || { streakDays: user?.streakDays || 0 })
      } catch (err) {
        console.error('Error loading GameHub stats:', err)
      } finally {
        setLoading(false)
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
  const totalEssays = overview?.totalEssays || 0
  const fireflies = questSummary?.fireflies || 0
  const earnedXP = totalVocab * 10 + totalEssays * 50 + fireflies * 20

  const userRank = overview?.rank || 'A1'
  const leagueMap = {
    A1: { name: 'Bronze League', icon: 'military_tech', rankNum: '#42' },
    A2: { name: 'Silver League', icon: 'military_tech', rankNum: '#28' },
    B1: { name: 'Gold League', icon: 'military_tech', rankNum: '#19' },
    B2: { name: 'Platinum League', icon: 'military_tech', rankNum: '#12' },
    C1: { name: 'Diamond League', icon: 'military_tech', rankNum: '#5' },
    C2: { name: 'Master League', icon: 'military_tech', rankNum: '#1' },
  }
  const currentLeague = leagueMap[userRank] || leagueMap.A1

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
      featureRight: '+50 XP / round',
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
      featureRight: '+45 XP / set',
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
      featureRight: '+60 XP / puzzle',
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
      featureRight: '+55 XP / match',
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
            title="Return to Library"
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

            <div className="hud-pill hud-pill--xp" title="Earned Fireflies & XP">
              <span className="material-symbols-outlined hud-pill__icon">grade</span>
              <span>{earnedXP.toLocaleString()} <span className="hud-pill__label">XP</span></span>
            </div>

            <div className="hud-pill hud-pill--hearts" title="Life Energy 5/5">
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
              <span>Live Battle Arena · {userRank} Tier</span>
            </div>
            <div className="hero-title-row">
              <h1 className="hero-title">{t('games.hubTitle', 'LexiGrow Play Zone')}</h1>
              <span className="hero-badge-pro">PRO PLAY</span>
            </div>
            <p className="hero-desc">
              {t('games.hubSubtitle', 'Sharpen vocabulary retention, master phonetics, and unlock linguistic mastery through tactile arcade drills.')}
            </p>
          </div>

          {/* Quick League Status Widget */}
          <div className="hero-league-widget">
            <div className="league-icon-box">
              <span className="material-symbols-outlined">{currentLeague.icon}</span>
            </div>
            <div className="league-meta">
              <div className="league-meta__tier">{currentLeague.name}</div>
              <div className="league-meta__rank">
                Rank {currentLeague.rankNum} <span>▲ Top 10%</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED BANNER: Quest Garden (Daily Crossword) */}
        <QuestGardenCard />

        {/* 4 Specialized Arcade Arena Cards */}
        <section>
          <div className="arcade-section-header">
            <h3>
              <span>Arcade Arena Modes</span>
              <span className="arcade-count-chip">4 Available</span>
            </h3>
            <p>Select a specialized game mode to train speed, grammar, morphology, or auditory recall.</p>
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
              <span className="strip-item-label">Daily Quest Goal</span>
              <div className="strip-item-value">{solvedQuest} / {totalQuest} Words Solved</div>
              <div className="strip-item-track">
                <div className="strip-item-fill" style={{ width: `${questPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Today's XP Yield */}
          <div className="bottom-strip-item">
            <div className="strip-item-icon strip-item-icon--purple">
              <span className="material-symbols-outlined">grade</span>
            </div>
            <div className="strip-item-info">
              <span className="strip-item-label">Today&apos;s Fireflies & XP</span>
              <div className="strip-item-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>+{fireflies > 0 ? fireflies * 20 : 50} XP Today</span>
                <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED', fontWeight: 600 }}>
                  🔥 Active
                </span>
              </div>
            </div>
          </div>

          {/* Competitive Ladder */}
          <div className="bottom-strip-item">
            <div className="strip-item-icon strip-item-icon--green">
              <span className="material-symbols-outlined">military_tech</span>
            </div>
            <div className="strip-item-info">
              <span className="strip-item-label">Competitive Ladder</span>
              <div className="strip-item-value">Rank {currentLeague.rankNum} in {currentLeague.name}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
