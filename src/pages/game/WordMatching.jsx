import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import confetti from 'canvas-confetti'
import GameVocabRecap from '../../components/learning/GameVocabRecap.jsx'
import { getCuratedTopicWords, GAME_CURATED_TOPICS } from '../../utils/gameVocabHelper.js'
import './WordMatching.css'

export default function WordMatching() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [gameState, setGameState] = useState('config')
  const [pairCount, setPairCount] = useState(4)
  const [selectedCategory] = useState('')
  const [vocabSource, setVocabSource] = useState('library') // 'library' | 'topic'
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [playedWords, setPlayedWords] = useState([])
  const [libraryCount, setLibraryCount] = useState(null)

  const [cards, setCards] = useState([])
  const [flippedIndices, setFlippedIndices] = useState([])
  const [matchedIds, setMatchedIds] = useState([])
  const [attempts, setAttempts] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(0)
  const timerInterval = useRef(null)
  const audioCtxRef = useRef(null)
  const timeoutRefs = useRef([])

  // Probe student library count on mount to pick best default source
  useEffect(() => {
    let isMounted = true
    async function checkLibrary() {
      try {
        const res = await api.get('/vocabulary?limit=1')
        if (isMounted && res.success) {
          const total = typeof res.total === 'number' ? res.total : (res.count || 0)
          setLibraryCount(total)
          if (total < 4) {
            setVocabSource('topic')
          }
        }
      } catch (e) {
        console.warn('Could not probe vocabulary count:', e)
      }
    }
    checkLibrary()
    return () => {
      isMounted = false
    }
  }, [])

  // Cleanup on unmount: clear timer, pending timeouts, close AudioContext
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
      timeoutRefs.current.forEach(id => clearTimeout(id))
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
    }
  }, [])

  const playSound = (type) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return

      // Reuse singleton AudioContext — creating a new one per call leaks resources
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass()
      }
      const ctx = audioCtxRef.current
      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') ctx.resume()

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
      let loaded = []
      if (vocabSource === 'topic') {
        loaded = getCuratedTopicWords(selectedTopic)
      } else {
        const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
        const response = await api.get(`/vocabulary?limit=150${categoryParam}`)

        if (response.success && response.data && response.data.length >= pairCount) {
          loaded = response.data
        } else {
          // If library doesn't have enough words, seamlessly discover from curated topics
          loaded = getCuratedTopicWords('all')
        }
      }

      if (!loaded || loaded.length < pairCount) {
        loaded = getCuratedTopicWords('all')
      }

      const selectedWords = [...loaded].sort(() => 0.5 - Math.random()).slice(0, pairCount)
      setPlayedWords(selectedWords)

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
          text: item.definition || item.meaningVi || item.meaning || ''
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
          const t1 = setTimeout(() => setGameState('victory'), 600)
          timeoutRefs.current.push(t1)
        }
      } else {
        // MISMATCH
        playSound('mismatch')
        setStreak(0)
        const t2 = setTimeout(() => setFlippedIndices([]), 900)
        timeoutRefs.current.push(t2)
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
              1. {t('games.vocabSource', 'Nguồn từ vựng')}
            </label>
            <div className="speed-options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div
                className={`speed-card ${vocabSource === 'library' ? 'speed-card--active' : ''}`}
                onClick={() => setVocabSource('library')}
              >
                <h4>📚 Thư viện của tôi</h4>
                <span>{libraryCount !== null ? `${libraryCount} từ đã lưu` : 'Từ vựng cá nhân'}</span>
              </div>
              <div
                className={`speed-card ${vocabSource === 'topic' ? 'speed-card--active' : ''}`}
                onClick={() => setVocabSource('topic')}
              >
                <h4>✨ Đề xuất theo chủ đề</h4>
                <span>Khám phá từ mới</span>
              </div>
            </div>
          </div>

          {vocabSource === 'topic' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
                2. Chủ đề khám phá
              </label>
              <div className="game-topic-chips">
                {GAME_CURATED_TOPICS.map((topic) => (
                  <button
                    key={topic.slug}
                    type="button"
                    className={`game-topic-chip ${selectedTopic === topic.slug ? 'game-topic-chip--active' : ''}`}
                    onClick={() => setSelectedTopic(topic.slug)}
                  >
                    <span className="material-symbols-outlined">{topic.icon}</span>
                    <span>{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
              {vocabSource === 'topic' ? '3.' : '2.'} {t('games.selectPairs', 'Select Card Pairs')}
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
        <div className="hunter-config-modal hunter-config-modal--victory" style={{ textAlign: 'center' }}>
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

          <GameVocabRecap
            words={playedWords}
            defaultTheme={vocabSource === 'topic' && selectedTopic !== 'all' ? selectedTopic : 'Word Matching'}
            defaultCategory={selectedCategory || 'daily'}
            sourceLabel={vocabSource === 'topic' ? `Đề xuất chủ đề: ${selectedTopic}` : 'Thư viện từ vựng'}
          />
        </div>
      )}
    </div>
  )
}
