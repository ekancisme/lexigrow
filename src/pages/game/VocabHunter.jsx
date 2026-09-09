import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import confetti from 'canvas-confetti'
import './VocabHunter.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'Accolade', definition: 'An award or privilege granted as special honor or in recognition of merit.', ipa: '/ˈæk.ə.leɪd/' },
  { _id: 'f2', word: 'Benevolent', definition: 'Well meaning and kindly; serving a charitable purpose.', ipa: '/bəˈnev.əl.ənt/' },
  { _id: 'f3', word: 'Capricious', definition: 'Given to sudden and unaccountable changes of mood or behavior.', ipa: '/kəˈprɪʃ.əs/' },
  { _id: 'f4', word: 'Diligent', definition: 'Having or showing care and conscientiousness in one\'s work or duties.', ipa: '/ˈdɪl.ɪ.dʒənt/' },
  { _id: 'f5', word: 'Eloquent', definition: 'Fluent or persuasive in speaking or writing.', ipa: '/ˈel.ə.kwənt/' },
  { _id: 'f6', word: 'Frugal', definition: 'Sparing or economical with regard to money or food.', ipa: '/ˈfruː.ɡəl/' },
  { _id: 'f7', word: 'Garrulous', definition: 'Excessively talkative, especially on trivial matters.', ipa: '/ˈɡær.ə.ləs/' },
  { _id: 'f8', word: 'Hypothesis', definition: 'A proposed explanation made on the basis of limited evidence.', ipa: '/haɪˈpɒθ.ə.sɪs/' },
  { _id: 'f9', word: 'Impeccable', definition: 'In accordance with the highest standards; faultless.', ipa: '/ɪmˈpek.ə.bəl/' },
  { _id: 'f10', word: 'Jubilant', definition: 'Feeling or expressing great happiness and triumph.', ipa: '/ˈdʒuː.bəl.ənt/' },
  { _id: 'f11', word: 'Tenacious', definition: 'Tending to keep a firm hold of something; clinging or adhering closely.', ipa: '/təˈneɪ.ʃəs/' },
  { _id: 'f12', word: 'Meticulous', definition: 'Showing great attention to detail; very careful and precise.', ipa: '/məˈtɪk.jə.ləs/' }
]

export default function VocabHunter() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  // Game configuration
  const [gameState, setGameState] = useState('config') // 'config' | 'loading' | 'playing' | 'gameover' | 'victory'
  const [selectedCategory, setSelectedCategory] = useState('')
  const [speedLevel, setSpeedLevel] = useState('medium') // 'easy' | 'medium' | 'hard'

  // Word pool
  const [vocabPool, setVocabPool] = useState([])
  const [roundIndex, setRoundIndex] = useState(0)

  // Current playing state
  const [targetWord, setTargetWord] = useState(null)
  const [bubbles, setBubbles] = useState([]) // array of { id, word, ipa, x, y, isWrongClicked, isCorrect }
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isFrozen, setIsFrozen] = useState(false)
  const [timer, setTimer] = useState(90)
  const [soundMuted, setSoundMuted] = useState(false)

  // Refs for loop
  const gameInterval = useRef(null)
  const timerInterval = useRef(null)
  const speedRef = useRef(1.5)
  const livesRef = useRef(3)

  // Web Audio sounds
  const playSound = (type) => {
    if (soundMuted) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'correct') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08) // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(130, ctx.currentTime)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else if (type === 'lose-life') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.setValueAtTime(147, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
      } else if (type === 'victory') {
        const now = ctx.currentTime
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(freq, now + idx * 0.08)
          g.gain.setValueAtTime(0.08, now + idx * 0.08)
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25)
          o.start(now + idx * 0.08)
          o.stop(now + idx * 0.08 + 0.3)
        })
      }
    } catch (e) {
      console.warn(e)
    }
  }

  // Load vocabulary
  const loadVocabulary = async () => {
    setGameState('loading')
    try {
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
      const response = await api.get(`/vocabulary?limit=150${categoryParam}`)

      let loaded = []
      if (response.success && response.data && response.data.length >= 4) {
        loaded = response.data
      } else {
        loaded = FALLBACK_WORDS
      }

      setVocabPool(loaded)
      startHunterGame(loaded)
    } catch (err) {
      console.error(err)
      setVocabPool(FALLBACK_WORDS)
      startHunterGame(FALLBACK_WORDS)
    }
  }

  const startHunterGame = (pool) => {
    setScore(0)
    setLives(3)
    livesRef.current = 3
    setStreak(0)
    setRoundIndex(0)
    setTimer(90)

    if (speedLevel === 'easy') speedRef.current = 1.0
    else if (speedLevel === 'medium') speedRef.current = 1.6
    else speedRef.current = 2.4

    setupNextRound(pool, 0)
    setGameState('playing')

    if (timerInterval.current) clearInterval(timerInterval.current)
    timerInterval.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current)
          setGameState('gameover')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const setupNextRound = (pool, currentIdx) => {
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random())
    const target = shuffledPool[0]
    setTargetWord(target)

    const distractors = shuffledPool.slice(1, 4)
    const options = [target, ...distractors].sort(() => 0.5 - Math.random())

    const xCoords = [8, 32, 58, 80].sort(() => 0.5 - Math.random())

    const generatedBubbles = options.map((opt, i) => ({
      id: `${opt._id || opt.word}-${Math.random()}`,
      word: opt.word,
      ipa: opt.ipa || `/ˈ${opt.word.toLowerCase()}/`,
      isTarget: opt.word.toLowerCase() === target.word.toLowerCase(),
      x: xCoords[i],
      y: -5 - Math.random() * 15,
      isWrongClicked: false,
      isCorrect: false
    }))

    setBubbles(generatedBubbles)
    setRoundIndex(currentIdx + 1)
  }

  // Game Loop for falling animation
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameInterval.current) clearInterval(gameInterval.current)
      return
    }

    gameInterval.current = setInterval(() => {
      if (isFrozen) return

      setBubbles((prevBubbles) => {
        let hitBottom = false
        const updated = prevBubbles.map((b) => {
          const nextY = b.y + speedRef.current
          if (nextY >= 82 && b.isTarget && !b.isCorrect) {
            hitBottom = true
          }
          return { ...b, y: nextY }
        })

        if (hitBottom) {
          playSound('lose-life')
          livesRef.current -= 1
          setLives(livesRef.current)
          setStreak(0)

          if (livesRef.current <= 0) {
            clearInterval(gameInterval.current)
            if (timerInterval.current) clearInterval(timerInterval.current)
            setGameState('gameover')
            return []
          }

          // Reset round if word dropped
          setTimeout(() => setupNextRound(vocabPool.length ? vocabPool : FALLBACK_WORDS, roundIndex), 300)
          return []
        }

        return updated
      })
    }, 50)

    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current)
    }
  }, [gameState, isFrozen, roundIndex, vocabPool])

  const handleBubbleClick = (bubble) => {
    if (gameState !== 'playing' || bubble.isWrongClicked || bubble.isCorrect) return

    if (bubble.isTarget) {
      playSound('correct')
      setBubbles((prev) =>
        prev.map((b) => (b.id === bubble.id ? { ...b, isCorrect: true } : b))
      )
      setScore((prev) => prev + 100 + streak * 20)
      setStreak((prev) => prev + 1)

      if (roundIndex >= 15) {
        playSound('victory')
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
        if (gameInterval.current) clearInterval(gameInterval.current)
        if (timerInterval.current) clearInterval(timerInterval.current)
        setGameState('victory')
      } else {
        setTimeout(() => setupNextRound(vocabPool.length ? vocabPool : FALLBACK_WORDS, roundIndex), 500)
      }
    } else {
      playSound('wrong')
      setStreak(0)
      setBubbles((prev) =>
        prev.map((b) => (b.id === bubble.id ? { ...b, isWrongClicked: true } : b))
      )
    }
  }

  // Tactical Power-up: Freeze Time (3 seconds)
  const handleFreeze = () => {
    if (isFrozen) return
    setIsFrozen(true)
    setTimeout(() => setIsFrozen(false), 3000)
  }

  // Tactical Power-up: Auto-Lock Hint
  const handleAutoLock = () => {
    const target = bubbles.find((b) => b.isTarget)
    if (target) handleBubbleClick(target)
  }

  return (
    <div className="vocab-hunter-page">
      {/* Background Grid & Ambience */}
      <div className="hunter-bg-ambient">
        <div className="hunter-bg-radial" />
        <div className="hunter-bg-grid" />
      </div>

      {gameState === 'config' && (
        <div className="hunter-config-modal">
          <div className="config-header">
            <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '16px', background: 'rgba(179, 92, 0, 0.15)', color: '#B35C00', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>sports_esports</span>
            </div>
            <h2>{t('games.hunterTitle', '🎯 Vocab Hunter')}</h2>
            <p>{t('games.hunterDesc', 'Pop falling vocabulary bubbles matching the target definition before they hit the danger zone!')}</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
              1. {t('games.selectSpeed', 'Select Falling Speed')}
            </label>
            <div className="speed-options-grid">
              <div
                className={`speed-card ${speedLevel === 'easy' ? 'speed-card--active' : ''}`}
                onClick={() => setSpeedLevel('easy')}
              >
                <h4>{t('games.easy', 'Practice')}</h4>
                <span>1.0x Speed</span>
              </div>
              <div
                className={`speed-card ${speedLevel === 'medium' ? 'speed-card--active' : ''}`}
                onClick={() => setSpeedLevel('medium')}
              >
                <h4>{t('games.normal', 'Normal')}</h4>
                <span>1.6x Speed</span>
              </div>
              <div
                className={`speed-card ${speedLevel === 'hard' ? 'speed-card--active' : ''}`}
                onClick={() => setSpeedLevel('hard')}
              >
                <h4>{t('games.hard', 'Expert')}</h4>
                <span>2.4x Speed</span>
              </div>
            </div>
          </div>

          <button
            className="arcade-btn-3d arcade-btn--hunter"
            onClick={loadVocabulary}
          >
            <span>{t('games.startHunting', 'Start Hunting')}</span>
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
                <span>Exit to Hub</span>
              </button>
              <div className="hunter-title-badge">
                <span className="material-symbols-outlined">sports_esports</span>
                <span>VocabHunter</span>
              </div>
            </div>

            <div className="hunter-hud-center">
              {/* Lives */}
              <div className="hud-stat-pill">
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--color-on-surface-variant)' }}>LIVES</span>
                <div className="hud-lives">
                  {[1, 2, 3].map((heart) => (
                    <span
                      key={heart}
                      className={`material-symbols-outlined heart-icon ${heart > lives ? 'heart-icon--lost' : ''}`}
                    >
                      favorite
                    </span>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#16A34A' }}>stars</span>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--color-on-surface-variant)' }}>SCORE:</span>
                <span className="hud-score-val">{score}</span>
              </div>

              {/* Round */}
              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>flag</span>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--color-on-surface-variant)' }}>ROUND:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-primary)', fontWeight: 800 }}>{roundIndex}/15</span>
              </div>

              {/* Streak */}
              {streak > 1 && (
                <div className="hud-stat-pill hud-streak-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_fire_department</span>
                  <span>{streak}x STREAK</span>
                </div>
              )}
            </div>

            <div className="hunter-hud-right">
              <div className="hud-timer">
                <span className="material-symbols-outlined">timer</span>
                <span>00:{timer < 10 ? `0${timer}` : timer}</span>
              </div>

              <button
                className="hunter-exit-btn"
                onClick={() => setSoundMuted(!soundMuted)}
                title={soundMuted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined">{soundMuted ? 'volume_off' : 'volume_up'}</span>
              </button>
            </div>
          </header>

          {/* Target Definition Banner */}
          <div className="hunter-target-banner">
            <div className="target-banner-top">
              <span className="target-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>crisis_alert</span>
                🎯 TARGET DEFINITION
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--color-on-surface-variant)' }}>
                · Academic Level Target
              </span>
            </div>
            <p className="target-definition-text">
              “{targetWord?.definition || 'Loading definition...'}”
            </p>
          </div>

          {/* Main Battle Arena & Sidebar */}
          <main className="hunter-main-layout">
            <div className="hunter-battle-canvas">
              {/* Bubble Arena */}
              <div className="hunter-bubble-arena">
                {bubbles.map((b) => (
                  <div
                    key={b.id}
                    className={`hunter-bubble ${b.isWrongClicked ? 'hunter-bubble--wrong' : ''} ${b.isCorrect ? 'hunter-bubble--correct' : ''}`}
                    style={{ left: `${b.x}%`, top: `${b.y}%` }}
                    onClick={() => handleBubbleClick(b)}
                  >
                    <div className="hunter-bubble-card">
                      <span className="bubble-word-text">{b.word}</span>
                      <span className="bubble-ipa-text">{b.ipa}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Danger Zone */}
              <div className="hunter-danger-zone">
                <div className="hazard-stripe">
                  <div className="hazard-text">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                    ════ DANGER ZONE — DON&apos;T LET WORDS DROP ════
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                  </div>
                </div>

                <div className="hunter-turret-base">
                  <span className="turret-status-text">
                    ⚡ Defense Turret Online · Click or tap the correct floating bubble!
                  </span>
                </div>
              </div>
            </div>

            {/* Right Metrics & Tactical Arsenal */}
            <aside className="hunter-sidebar">
              <div className="hunter-card-panel">
                <div className="panel-header">
                  <span>Hunter Metrics</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>LIVE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--color-on-surface-variant)', display: 'block' }}>WAVE</span>
                    <strong style={{ fontSize: '16px', color: '#16A34A' }}>{roundIndex}/15</strong>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--color-on-surface-variant)', display: 'block' }}>STREAK</span>
                    <strong style={{ fontSize: '16px', color: '#B35C00' }}>{streak}x</strong>
                  </div>
                </div>
              </div>

              <div className="hunter-card-panel" style={{ flex: 1 }}>
                <div className="panel-header">
                  <span>Tactical Arsenal</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>POWER-UPS</span>
                </div>
                <div className="powerup-grid">
                  <button
                    className="powerup-btn"
                    onClick={handleFreeze}
                    disabled={isFrozen}
                  >
                    <span style={{ fontSize: '18px' }}>❄️</span>
                    <div>
                      <div>Freeze Time</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>Pause falling (3s)</div>
                    </div>
                  </button>

                  <button
                    className="powerup-btn"
                    onClick={handleAutoLock}
                  >
                    <span style={{ fontSize: '18px' }}>🎯</span>
                    <div>
                      <div>Auto-Lock Target</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>Instantly shoot correct word</div>
                    </div>
                  </button>
                </div>
              </div>
            </aside>
          </main>
        </>
      )}

      {(gameState === 'gameover' || gameState === 'victory') && (
        <div className="hunter-config-modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {gameState === 'victory' ? '🏆' : '💀'}
          </div>
          <h2>{gameState === 'victory' ? 'Victory! Sector Cleared' : 'Game Over'}</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#B35C00' }}>
            Final Score: {score} pts · Rounds Cleared: {roundIndex}/15
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              className="arcade-btn-3d arcade-btn--hunter"
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
