import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import confetti from 'canvas-confetti'
import GameVocabRecap from '../../components/learning/GameVocabRecap.jsx'
import { getCuratedTopicWords, GAME_CURATED_TOPICS } from '../../utils/gameVocabHelper.js'
import './ContextFiller.css'

export default function ContextFiller() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [gameState, setGameState] = useState('config')
  const [roundCount, setRoundCount] = useState(5)
  const [selectedCategory] = useState('')
  const [vocabSource, setVocabSource] = useState('library') // 'library' | 'topic'
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [libraryCount, setLibraryCount] = useState(null)

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

  // Probe library count on mount
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

  // Clear the round timer when the component unmounts (e.g. Exit / navigate away).
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [])

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
      let loaded = []
      if (vocabSource === 'topic') {
        loaded = getCuratedTopicWords(selectedTopic).filter((w) => w.examples && w.examples.length > 0)
      } else {
        const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
        const response = await api.get(`/vocabulary?limit=150${categoryParam}`)

        if (response.success && response.data && response.data.length > 0) {
          loaded = response.data.filter((w) => w.examples && w.examples.length > 0)
        }
      }

      if (loaded.length < 4) {
        loaded = getCuratedTopicWords('all').filter((w) => w.examples && w.examples.length > 0)
      }

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
      const fallback = getCuratedTopicWords('all').filter((w) => w.examples && w.examples.length > 0)
      const selection = fallback.slice(0, roundCount)
      setWords(selection)
      setCurrentRoundIndex(0)
      setScore(0)
      setStreak(0)
      setTimer(0)
      setupRound(selection, 0, fallback)
      setGameState('playing')

      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => setTimer((prev) => prev + 1), 1000)
    }
  }

  const setupRound = (list, index, fullPool) => {
    const target = list[index]
    if (!target) return
    setCurrentWord(target)

    const rawSentence = (target.examples && target.examples[0]) || `The word _______ fits this sentence.`
    const escaped = String(target.word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
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
              {vocabSource === 'topic' ? '3.' : '2.'} {t('games.selectRounds', 'Select Question Count')}
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
        <div className="hunter-config-modal hunter-config-modal--victory" style={{ textAlign: 'center' }}>
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

          <GameVocabRecap
            words={words}
            defaultTheme={vocabSource === 'topic' && selectedTopic !== 'all' ? selectedTopic : 'Context Filler'}
            defaultCategory={selectedCategory || 'daily'}
            sourceLabel={vocabSource === 'topic' ? `Đề xuất chủ đề: ${selectedTopic}` : 'Thư viện từ vựng'}
          />
        </div>
      )}
    </div>
  )
}
