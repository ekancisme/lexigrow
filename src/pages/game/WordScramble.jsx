import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import confetti from 'canvas-confetti'
import './WordScramble.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'Evaluate', definition: 'Form an idea of the amount, number, or value of; assess.', partOfSpeech: 'verb', ipa: '/ɪˈvæl.ju.eɪt/' },
  { _id: 'f2', word: 'Synthesize', definition: 'Combine a number of things into a coherent whole.', partOfSpeech: 'verb', ipa: '/ˈsɪn.θə.saɪz/' },
  { _id: 'f3', word: 'Significant', definition: 'Sufficiently great or important to be worthy of attention; noteworthy.', partOfSpeech: 'adjective', ipa: '/sɪɡˈnɪf.ɪ.kənt/' },
  { _id: 'f4', word: 'Empirical', definition: 'Based on, concerned with, or verifiable by observation or experience rather than theory.', partOfSpeech: 'adjective', ipa: '/ɪmˈpɪr.ɪ.kəl/' },
  { _id: 'f5', word: 'Eloquent', definition: 'Fluent or persuasive in speaking or writing.', partOfSpeech: 'adjective', ipa: '/ˈel.ə.kwənt/' },
  { _id: 'f6', word: 'Frugal', definition: 'Sparing or economical with regard to money or food.', partOfSpeech: 'adjective', ipa: '/ˈfruː.ɡəl/' }
]

export default function WordScramble() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  // Game state
  const [gameState, setGameState] = useState('config') // 'config' | 'loading' | 'playing' | 'victory'
  const [roundCount, setRoundCount] = useState(5)
  const [selectedCategory, setSelectedCategory] = useState('')

  // Word list state
  const [words, setWords] = useState([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)

  // Current playing word state
  const [currentWordObj, setCurrentWordObj] = useState(null)
  const [scrambledLetters, setScrambledLetters] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(null) // null | true | false
  const [hintLevel, setHintLevel] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(0)
  const inputRef = useRef(null)
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

      if (type === 'correct') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, ctx.currentTime)
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(150, ctx.currentTime)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  const scramble = (word) => {
    const letters = word.toUpperCase().split('')
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]]
    }
    return letters
  }

  const loadWords = async () => {
    setGameState('loading')
    try {
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
      const response = await api.get(`/vocabulary?limit=150${categoryParam}`)

      let loaded = []
      if (response.success && response.data && response.data.length > 0) {
        loaded = response.data
      } else {
        loaded = FALLBACK_WORDS
      }

      const selection = [...loaded].sort(() => 0.5 - Math.random()).slice(0, Math.min(roundCount, loaded.length))
      setWords(selection)
      setCurrentRoundIndex(0)
      setScore(0)
      setStreak(0)
      setTimer(0)

      setupRound(selection, 0)
      setGameState('playing')

      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => setTimer((prev) => prev + 1), 1000)
    } catch (e) {
      console.error(e)
      const selection = [...FALLBACK_WORDS].slice(0, Math.min(roundCount, FALLBACK_WORDS.length))
      setWords(selection)
      setCurrentRoundIndex(0)
      setScore(0)
      setStreak(0)
      setTimer(0)
      setupRound(selection, 0)
      setGameState('playing')
    }
  }

  const setupRound = (list, index) => {
    const wordObj = list[index]
    if (!wordObj) return
    setCurrentWordObj(wordObj)
    setScrambledLetters(scramble(wordObj.word))
    setUserInput('')
    setIsCorrect(null)
    setHintLevel(0)
    setTimeout(() => inputRef.current?.focus(), 150)
  }

  const handleLetterClick = (letter) => {
    if (isCorrect === true) return
    setUserInput((prev) => prev + letter)
  }

  const handleCheck = () => {
    if (!currentWordObj || !userInput.trim()) return

    const correctWord = currentWordObj.word.toUpperCase().trim()
    const entered = userInput.toUpperCase().trim()

    if (entered === correctWord) {
      playSound('correct')
      setIsCorrect(true)
      setScore((prev) => prev + 1)
      setStreak((prev) => prev + 1)

      setTimeout(() => {
        if (currentRoundIndex + 1 >= words.length) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
          if (timerInterval.current) clearInterval(timerInterval.current)
          setGameState('victory')
        } else {
          setCurrentRoundIndex((prev) => prev + 1)
          setupRound(words, currentRoundIndex + 1)
        }
      }, 1000)
    } else {
      playSound('wrong')
      setIsCorrect(false)
      setStreak(0)
      setTimeout(() => setIsCorrect(null), 1000)
    }
  }

  const handleHint = () => {
    if (!currentWordObj) return
    setHintLevel((prev) => Math.min(prev + 1, 2))
  }

  const handleSkip = () => {
    setStreak(0)
    if (currentRoundIndex + 1 >= words.length) {
      if (timerInterval.current) clearInterval(timerInterval.current)
      setGameState('victory')
    } else {
      setCurrentRoundIndex((prev) => prev + 1)
      setupRound(words, currentRoundIndex + 1)
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="word-scramble-page">
      {gameState === 'config' && (
        <div className="hunter-config-modal">
          <div className="config-header">
            <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '16px', background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>spellcheck</span>
            </div>
            <h2>{t('games.scrambleTitle', '🔤 Word Scramble')}</h2>
            <p>{t('games.scrambleDesc', 'Spelling mastery! Rearrange scrambled letters with phonetic IPA and definitions.')}</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
              1. {t('games.selectRounds', 'Select Puzzle Count')}
            </label>
            <div className="speed-options-grid">
              <div
                className={`speed-card ${roundCount === 5 ? 'speed-card--active' : ''}`}
                onClick={() => setRoundCount(5)}
              >
                <h4>5 Words</h4>
                <span>Quick Sprint</span>
              </div>
              <div
                className={`speed-card ${roundCount === 10 ? 'speed-card--active' : ''}`}
                onClick={() => setRoundCount(10)}
              >
                <h4>10 Words</h4>
                <span>Standard</span>
              </div>
              <div
                className={`speed-card ${roundCount === 15 ? 'speed-card--active' : ''}`}
                onClick={() => setRoundCount(15)}
              >
                <h4>15 Words</h4>
                <span>Mastery</span>
              </div>
            </div>
          </div>

          <button
            className="arcade-btn-3d arcade-btn--scramble"
            onClick={loadWords}
          >
            <span>Start Scramble</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7C3AED', fontWeight: 800 }}>
                <span>🔤</span>
                <span>Word Scramble</span>
              </div>
            </div>

            <div className="hunter-hud-center">
              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7C3AED' }}>timer</span>
                <span>{formatTimer(timer)}</span>
              </div>

              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#16A34A' }}>military_tech</span>
                <span>Score: <strong style={{ color: '#16A34A' }}>{score}</strong>/{words.length}</span>
              </div>

              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>layers</span>
                <span>Word: <strong>{currentRoundIndex + 1}</strong>/{words.length}</span>
              </div>

              {streak > 1 && (
                <div className="hud-stat-pill hud-streak-pill" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED' }}>
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

          <div className="scramble-container">
            {/* Academic Clue Card */}
            <div className="scramble-clue-card">
              <div className="clue-meta-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="pos-tag">{currentWordObj?.partOfSpeech || 'vocabulary'}</span>
                  {currentWordObj?.ipa && (
                    <div className="ipa-box">
                      <span>{currentWordObj.ipa}</span>
                    </div>
                  )}
                </div>

                {hintLevel > 0 && (
                  <div className="hint-badge-box">
                    <span>💡 Hint: Starts with <strong>&quot;{currentWordObj?.word[0]}&quot;</strong></span>
                    {hintLevel === 2 && (
                      <span> and ends with <strong>&quot;{currentWordObj?.word[currentWordObj.word.length - 1]}&quot;</strong></span>
                    )}
                  </div>
                )}
              </div>

              <p className="clue-definition-text">
                “{currentWordObj?.definition || 'Loading definition...'}”
              </p>
            </div>

            {/* Letter Tiles Stage */}
            <div className="scramble-tiles-stage">
              <div className="tiles-row">
                {scrambledLetters.map((l, i) => (
                  <button
                    key={i}
                    className="letter-tile"
                    onClick={() => handleLetterClick(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <div className="scramble-input-box">
                <input
                  ref={inputRef}
                  type="text"
                  className={`scramble-input ${isCorrect === true ? 'scramble-input--correct' : ''} ${isCorrect === false ? 'scramble-input--wrong' : ''}`}
                  placeholder="TYPE WORD..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  maxLength={currentWordObj?.word.length + 3}
                />
              </div>

              {/* Action Buttons */}
              <div className="scramble-actions-row">
                <button
                  className="arcade-btn-3d arcade-btn--scramble"
                  style={{ flex: 2 }}
                  onClick={handleCheck}
                >
                  <span>Check Word</span>
                  <span className="material-symbols-outlined">check_circle</span>
                </button>

                <button
                  className="hunter-exit-btn"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={handleHint}
                >
                  <span className="material-symbols-outlined">lightbulb</span>
                  <span>Hint</span>
                </button>

                <button
                  className="hunter-exit-btn"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={handleSkip}
                >
                  <span className="material-symbols-outlined">skip_next</span>
                  <span>Skip</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {gameState === 'victory' && (
        <div className="hunter-config-modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
          <h2>Scramble Challenge Complete!</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7C3AED' }}>
            Score: {score} / {words.length} correct in {formatTimer(timer)}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              className="arcade-btn-3d arcade-btn--scramble"
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
