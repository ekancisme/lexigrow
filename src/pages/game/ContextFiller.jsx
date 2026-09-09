import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import confetti from 'canvas-confetti'
import './ContextFiller.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'stagnant', definition: 'Not growing or developing; stale or inactive.', examples: ['The economy has remained _______ for the past few quarters, with no signs of growth.'] },
  { _id: 'f2', word: 'evaluate', definition: 'Form an idea of the amount, number, or value of.', examples: ['Researchers must _______ all evidence carefully before drawing firm conclusions.'] },
  { _id: 'f3', word: 'synthesize', definition: 'Combine separate elements to form a coherent whole.', examples: ['The author aims to _______ diverse perspectives into a unified narrative.'] },
  { _id: 'f4', word: 'significant', definition: 'Great or important; worthy of attention.', examples: ['There has been a _______ breakthrough in renewable energy technology this year.'] },
  { _id: 'f5', word: 'empirical', definition: 'Based on observation or experience rather than theory.', examples: ['The scientists presented _______ data collected over five years of fieldwork.'] }
]

export default function ContextFiller() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [gameState, setGameState] = useState('config')
  const [roundCount, setRoundCount] = useState(5)
  const [selectedCategory, setSelectedCategory] = useState('')

  const [words, setWords] = useState([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState(null)
  const [blankedSentence, setBlankedSentence] = useState('')
  const [options, setOptions] = useState([])

  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
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

      if (type === 'correct') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(160, ctx.currentTime)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  const loadWords = async () => {
    setGameState('loading')
    try {
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
      const response = await api.get(`/vocabulary?limit=150${categoryParam}`)

      let loaded = []
      if (response.success && response.data && response.data.length > 0) {
        loaded = response.data.filter((w) => w.examples && w.examples.length > 0)
      }
      if (loaded.length < 4) loaded = FALLBACK_WORDS

      const selection = [...loaded].sort(() => 0.5 - Math.random()).slice(0, Math.min(roundCount, loaded.length))
      setWords(selection)
      setCurrentRoundIndex(0)
      setScore(0)
      setStreak(0)
      setTimer(0)

      setupRound(selection, 0, loaded)
      setGameState('playing')

      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => setTimer((prev) => prev + 1), 1000)
    } catch (e) {
      console.error(e)
      setWords(FALLBACK_WORDS)
      setupRound(FALLBACK_WORDS, 0, FALLBACK_WORDS)
      setGameState('playing')
    }
  }

  const setupRound = (list, index, fullPool) => {
    const target = list[index]
    if (!target) return
    setCurrentWord(target)

    const rawSentence = (target.examples && target.examples[0]) || `The word _______ fits this sentence.`
    const regex = new RegExp(target.word, 'gi')
    const blanked = rawSentence.includes('_______')
      ? rawSentence
      : rawSentence.replace(regex, '_______')

    setBlankedSentence(blanked)

    const pool = (fullPool || words).filter((w) => w.word.toLowerCase() !== target.word.toLowerCase())
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3)
    const opts = [target, ...shuffledPool].sort(() => 0.5 - Math.random())

    setOptions(opts)
    setSelectedOption(null)
    setIsAnswered(false)
  }

  const handleSelectOption = (opt) => {
    if (isAnswered) return
    setSelectedOption(opt.word)
    setIsAnswered(true)

    const isCorrect = opt.word.toLowerCase() === currentWord.word.toLowerCase()
    if (isCorrect) {
      playSound('correct')
      setScore((prev) => prev + 1)
      setStreak((prev) => prev + 1)
    } else {
      playSound('wrong')
      setStreak(0)
    }
  }

  const handleNextQuestion = () => {
    if (currentRoundIndex + 1 >= words.length) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      if (timerInterval.current) clearInterval(timerInterval.current)
      setGameState('victory')
    } else {
      setCurrentRoundIndex((prev) => prev + 1)
      setupRound(words, currentRoundIndex + 1, words)
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="context-filler-page">
      {gameState === 'config' && (
        <div className="hunter-config-modal">
          <div className="config-header">
            <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '16px', background: 'rgba(0, 91, 191, 0.15)', color: '#005BBF', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>psychology</span>
            </div>
            <h2>{t('games.fillerTitle', '📝 Context Filler')}</h2>
            <p>{t('games.fillerDesc', 'Read authentic sentences from literature & news, choose the missing vocabulary in context.')}</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
              1. {t('games.selectRounds', 'Select Question Count')}
            </label>
            <div className="speed-options-grid">
              <div
                className={`speed-card ${roundCount === 5 ? 'speed-card--active' : ''}`}
                onClick={() => setRoundCount(5)}
              >
                <h4>5 Questions</h4>
                <span>Quick Sprint</span>
              </div>
              <div
                className={`speed-card ${roundCount === 8 ? 'speed-card--active' : ''}`}
                onClick={() => setRoundCount(8)}
              >
                <h4>8 Questions</h4>
                <span>Standard</span>
              </div>
              <div
                className={`speed-card ${roundCount === 12 ? 'speed-card--active' : ''}`}
                onClick={() => setRoundCount(12)}
              >
                <h4>12 Questions</h4>
                <span>Mastery</span>
              </div>
            </div>
          </div>

          <button
            className="arcade-btn-3d arcade-btn--filler"
            onClick={loadWords}
          >
            <span>Start Practice</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 800 }}>
                <span>📝</span>
                <span>Context Filler</span>
              </div>
            </div>

            <div className="hunter-hud-center">
              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>timer</span>
                <span>{formatTimer(timer)}</span>
              </div>

              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#16A34A' }}>military_tech</span>
                <span>Score: <strong style={{ color: '#16A34A' }}>{score}</strong>/{words.length}</span>
              </div>

              <div className="hud-stat-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>flag</span>
                <span>Question: <strong>{currentRoundIndex + 1}</strong>/{words.length}</span>
              </div>

              {streak > 1 && (
                <div className="hud-stat-pill hud-streak-pill" style={{ background: 'rgba(0, 91, 191, 0.15)', color: 'var(--color-primary)' }}>
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

          <div className="filler-container">
            {/* Authentic Sentence Card */}
            <div className="filler-sentence-card">
              <span className="sentence-tag">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>menu_book</span>
                AUTHENTIC LITERATURE & NEWS CONTEXT
              </span>
              <p className="filler-quote-text">
                “{blankedSentence.split('_______').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={`sentence-blank-slot ${isAnswered && selectedOption ? 'sentence-blank-slot--filled' : ''}`}>
                        {isAnswered && selectedOption ? selectedOption : '_______'}
                      </span>
                    )}
                  </span>
                ))}”
              </p>
            </div>

            {/* 4 Options Grid */}
            <div className="filler-options-grid">
              {options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const isSelected = selectedOption === opt.word
                const isTarget = opt.word.toLowerCase() === currentWord.word.toLowerCase()
                let statusClass = ''

                if (isAnswered) {
                  if (isTarget) statusClass = 'filler-option-card--correct'
                  else if (isSelected && !isTarget) statusClass = 'filler-option-card--wrong'
                }

                return (
                  <div
                    key={opt._id || opt.word}
                    className={`filler-option-card ${statusClass} ${isAnswered ? 'filler-option-card--disabled' : ''}`}
                    onClick={() => handleSelectOption(opt)}
                  >
                    <div className="option-badge-key">{letter}</div>
                    <div className="option-word-title">{opt.word}</div>
                  </div>
                )
              })}
            </div>

            {/* Explanation & Next Question Panel */}
            {isAnswered && (
              <div className="filler-explanation-panel animate-fade-in">
                <div>
                  <div style={{ fontWeight: 800, color: selectedOption?.toLowerCase() === currentWord?.word?.toLowerCase() ? '#16A34A' : '#E53935', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined">
                      {selectedOption?.toLowerCase() === currentWord?.word?.toLowerCase() ? 'check_circle' : 'error'}
                    </span>
                    <span>
                      {selectedOption?.toLowerCase() === currentWord?.word?.toLowerCase() ? 'Correct!' : 'Incorrect!'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-on-surface)' }}>
                    <strong>{currentWord.word}</strong>: {currentWord.definition}
                  </p>
                </div>

                <button
                  className="arcade-btn-3d arcade-btn--tertiary"
                  onClick={handleNextQuestion}
                  style={{ width: 'auto', minWidth: '180px' }}
                >
                  <span>Next Question</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {gameState === 'victory' && (
        <div className="hunter-config-modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
          <h2>Context Mastery Complete!</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            Score: {score} / {words.length} in {formatTimer(timer)}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              className="arcade-btn-3d arcade-btn--filler"
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
