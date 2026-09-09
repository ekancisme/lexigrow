import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import confetti from 'canvas-confetti'
import './WordMatching.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'Accolade', definition: 'An award or privilege granted as a special honor or recognition of merit.' },
  { _id: 'f2', word: 'Benevolent', definition: 'Well meaning and kindly; serving a charitable purpose.' },
  { _id: 'f3', word: 'Capricious', definition: 'Given to sudden and unaccountable changes of mood or behavior.' },
  { _id: 'f4', word: 'Diligent', definition: 'Having or showing conscientiousness in one\'s work or duties.' },
  { _id: 'f5', word: 'Eloquent', definition: 'Fluent or persuasive in speaking or writing.' },
  { _id: 'f6', word: 'Frugal', definition: 'Sparing or economical with regard to money or food.' },
  { _id: 'f7', word: 'Garrulous', definition: 'Excessively talkative, especially on trivial matters.' },
  { _id: 'f8', word: 'Hypothesis', definition: 'A proposed explanation made on the basis of limited evidence.' }
]

export default function WordMatching() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [gameState, setGameState] = useState('config')
  const [pairCount, setPairCount] = useState(4)
  const [selectedCategory, setSelectedCategory] = useState('')

  const [cards, setCards] = useState([])
  const [flippedIndices, setFlippedIndices] = useState([])
  const [matchedIds, setMatchedIds] = useState([])
  const [attempts, setAttempts] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(0)
  const timerInterval = useRef(null)

  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'match') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, ctx.currentTime)
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      } else if (type === 'mismatch') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  const loadGame = async () => {
    setGameState('loading')
    try {
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
      const response = await api.get(`/vocabulary?limit=150${categoryParam}`)

      let loaded = []
      if (response.success && response.data && response.data.length >= pairCount) {
        loaded = response.data
      } else {
        loaded = FALLBACK_WORDS
      }

      const selectedWords = [...loaded].sort(() => 0.5 - Math.random()).slice(0, pairCount)

      // Create card pairs: Word card + Definition card
      const cardPairs = []
      selectedWords.forEach((item) => {
        cardPairs.push({
          id: `${item._id || item.word}-w`,
          pairId: item._id || item.word,
          type: 'word',
          text: item.word
        })
        cardPairs.push({
          id: `${item._id || item.word}-d`,
          pairId: item._id || item.word,
          type: 'definition',
          text: item.definition
        })
      })

      // Shuffle cards
      setCards(cardPairs.sort(() => 0.5 - Math.random()))
      setFlippedIndices([])
      setMatchedIds([])
      setAttempts(0)
      setStreak(0)
      setTimer(0)

      setGameState('playing')

      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => setTimer((prev) => prev + 1), 1000)
    } catch (e) {
      console.error(e)
      setGameState('config')
    }
  }

  const handleCardClick = (idx) => {
    if (flippedIndices.length >= 2 || flippedIndices.includes(idx)) return
    const card = cards[idx]
    if (matchedIds.includes(card.pairId)) return

    const nextFlipped = [...flippedIndices, idx]
    setFlippedIndices(nextFlipped)

    if (nextFlipped.length === 2) {
      setAttempts((prev) => prev + 1)
      const firstCard = cards[nextFlipped[0]]
      const secondCard = cards[nextFlipped[1]]

      if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
        // MATCH!
        playSound('match')
        setStreak((prev) => prev + 1)
        const nextMatched = [...matchedIds, firstCard.pairId]
        setMatchedIds(nextMatched)
        setFlippedIndices([])

        if (nextMatched.length === pairCount) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
          if (timerInterval.current) clearInterval(timerInterval.current)
          setTimeout(() => setGameState('victory'), 600)
        }
      } else {
        // MISMATCH
        playSound('mismatch')
        setStreak(0)
        setTimeout(() => setFlippedIndices([]), 900)
      }
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="word-matching-page">
      {gameState === 'config' && (
        <div className="hunter-config-modal">
          <div className="config-header">
            <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '16px', background: 'rgba(8, 145, 178, 0.15)', color: '#0891B2', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>extension</span>
            </div>
            <h2>{t('games.matchingTitle', '🧩 Word Matching')}</h2>
            <p>{t('games.matchingDesc', 'Memory challenge! Flip 3D cards to match English vocabulary with definitions.')}</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
              1. {t('games.selectPairs', 'Select Card Pairs')}
            </label>
            <div className="speed-options-grid">
              <div
                className={`speed-card ${pairCount === 4 ? 'speed-card--active' : ''}`}
                onClick={() => setPairCount(4)}
              >
                <h4>4 Pairs</h4>
                <span>8 Cards (2x4)</span>
              </div>
              <div
                className={`speed-card ${pairCount === 6 ? 'speed-card--active' : ''}`}
                onClick={() => setPairCount(6)}
              >
                <h4>6 Pairs</h4>
                <span>12 Cards (3x4)</span>
              </div>
              <div
                className={`speed-card ${pairCount === 8 ? 'speed-card--active' : ''}`}
                onClick={() => setPairCount(8)}
              >
                <h4>8 Pairs</h4>
                <span>16 Cards (4x4)</span>
              </div>
            </div>
          </div>

          <button
            className="arcade-btn-3d arcade-btn--matching"
            onClick={loadGame}
          >
            <span>Start Matching</span>
            <span className="material-symbols-outlined">play_arrow</span>
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          {/* Top HUD Header */}
          <header className="hunter-hud-header">
            <div className="hunter-hud-left">
              <button className="hunter-exit-btn" onClick={() => navigate('/student/game')}>
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Exit</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0891B2', fontWeight: 800 }}>
                <span>🧩</span>
                <span>Word Matching</span>
              </div>
            </div>

            <div className="hunter-hud-center">
              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0891B2' }}>timer</span>
                <span>{formatTimer(timer)}</span>
              </div>

              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#16A34A' }}>check_circle</span>
                <span>Matched: <strong style={{ color: '#16A34A' }}>{matchedIds.length}</strong>/{pairCount}</span>
              </div>

              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-outline)' }}>ads_click</span>
                <span>Attempts: <strong>{attempts}</strong></span>
              </div>

              {streak > 1 && (
                <div className="hud-stat-pill hud-streak-pill" style={{ background: 'rgba(8, 145, 178, 0.15)', color: '#0891B2' }}>
                  <span>🔥 {streak}x Streak</span>
                </div>
              )}
            </div>

            <div className="hunter-hud-right">
              <button className="hunter-exit-btn" onClick={() => navigate('/student/game')}>
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </header>

          <div className="matching-container">
            <div className={`memory-cards-grid memory-cards-grid--${pairCount}`}>
              {cards.map((card, idx) => {
                const isFlipped = flippedIndices.includes(idx)
                const isMatched = matchedIds.includes(card.pairId)

                return (
                  <div
                    key={card.id}
                    className={`memory-card-wrapper ${isFlipped ? 'memory-card-wrapper--flipped' : ''} ${isMatched ? 'memory-card-wrapper--matched' : ''}`}
                    onClick={() => handleCardClick(idx)}
                  >
                    <div className="memory-card-inner">
                      {/* Front Cover */}
                      <div className="memory-card-face memory-card-front">
                        <span className="material-symbols-outlined front-pattern-icon">
                          {card.type === 'word' ? 'menu_book' : 'psychology'}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: 800, marginTop: '4px', letterSpacing: '0.05em' }}>
                          LEXIGROW 3D
                        </span>
                      </div>

                      {/* Back Card */}
                      <div className="memory-card-face memory-card-back">
                        <span className="card-back-type">{card.type === 'word' ? 'Target Word' : 'Definition'}</span>
                        <div className={card.type === 'word' ? 'card-back-text' : 'card-back-def'}>
                          {card.text}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {gameState === 'victory' && (
        <div className="hunter-config-modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
          <h2>Memory Challenge Complete!</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0891B2' }}>
            Matched all {pairCount} pairs in {attempts} attempts ({formatTimer(timer)})
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              className="arcade-btn-3d arcade-btn--matching"
              onClick={() => setGameState('config')}
              style={{ width: 'auto' }}
            >
              Play Again
            </button>
            <button
              className="hunter-exit-btn"
              onClick={() => navigate('/student/game')}
              style={{ padding: '12px 20px', borderRadius: '16px' }}
            >
              Exit to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
