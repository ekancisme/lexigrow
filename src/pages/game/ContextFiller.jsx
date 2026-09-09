import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import './ContextFiller.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'stagnant', definition: 'Not growing or developing; stale or inactive.', examples: ['The economy has remained stagnant for the past few quarters.'] },
  { _id: 'f2', word: 'evaluate', definition: 'Form an idea of the amount, number, or value of.', examples: ['We need to evaluate the results of the project before proceeding.'] },
  { _id: 'f3', word: 'synthesize', definition: 'Combine separate elements to form a coherent whole.', examples: ['The author tries to synthesize different scientific theories in her book.'] },
  { _id: 'f4', word: 'significant', definition: 'Great or important; worthy of attention.', examples: ['There has been a significant increase in online sales this year.'] },
  { _id: 'f5', word: 'empirical', definition: 'Based on observation or experience rather than theory.', examples: ['They provided empirical evidence to support their research findings.'] },
  { _id: 'f6', word: 'methodology', definition: 'A system of methods used in a particular area of study.', examples: ['The research methodology must be clearly explained in your essay.'] }
]

export default function ContextFiller() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  // Game state
  const [gameState, setGameState] = useState('config') // 'config' | 'loading' | 'playing' | 'victory'
  const [roundCount, setRoundCount] = useState(5)
  const [selectedCategory, setSelectedCategory] = useState('')

  // Word list and gameplay
  const [words, setWords] = useState([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState(null)
  const [blankedSentence, setBlankedSentence] = useState('')
  const [options, setOptions] = useState([])
  
  // Scoring & selection
  const [selectedOption, setSelectedOption] = useState(null) // selected word string
  const [isAnswered, setIsAnswered] = useState(false)
  const [isFirstTryCorrect, setIsFirstTryCorrect] = useState(true)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  
  // Timer
  const [timer, setTimer] = useState(0)
  const timerInterval = useRef(null)

  // Web Audio Context sounds
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
        osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08) // C#5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16) // E5
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(180, ctx.currentTime)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'victory') {
        const now = ctx.currentTime
        const notes = [261.63, 329.63, 392.00, 523.25]
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(freq, now + idx * 0.1)
          g.gain.setValueAtTime(0.08, now + idx * 0.1)
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25)
          o.start(now + idx * 0.1)
          o.stop(now + idx * 0.1 + 0.3)
        })
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
        // filter words that have at least one example sentence
        loaded = response.data.filter(w => w.examples && w.examples.length > 0 && w.examples[0].trim() !== '')
        if (loaded.length < 4) {
          loaded = FALLBACK_WORDS
        }
      } else {
        loaded = FALLBACK_WORDS
      }

      const selection = [...loaded].sort(() => 0.5 - Math.random()).slice(0, Math.min(roundCount, loaded.length))
      setWords(selection)
      setCurrentRoundIndex(0)
      setScore(0)
      setTimer(0)
      
      setupRound(selection, 0, loaded)
      setGameState('playing')

      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } catch (e) {
      console.error(e)
      setWords(FALLBACK_WORDS)
      setCurrentRoundIndex(0)
      setScore(0)
      setTimer(0)
      setupRound(FALLBACK_WORDS, 0, FALLBACK_WORDS)
      setGameState('playing')
    }
  }

  const setupRound = (roundWords, index, pool) => {
    const wordObj = roundWords[index]
    setCurrentWord(wordObj)
    
    // Blank out word in sentence
    const sentence = wordObj.examples[0]
    // Use regex to case-insensitively replace the word with blanks
    const escapedWord = wordObj.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi')
    const blanked = sentence.replace(regex, '_______')
    setBlankedSentence(blanked)

    // Generate multiple choice options: correct word + 3 random distractors from pool
    const distractors = pool
      .filter(w => w.word.toLowerCase() !== wordObj.word.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.word)

    const shuffledOptions = [wordObj.word, ...distractors].sort(() => 0.5 - Math.random())
    setOptions(shuffledOptions)

    setSelectedOption(null)
    setIsAnswered(false)
    setIsFirstTryCorrect(true)
    setAttempts(0)
  }

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  const handleOptionClick = (opt) => {
    if (isAnswered) return
    
    setSelectedOption(opt)
    const isCorrectChoice = opt.toLowerCase() === currentWord.word.toLowerCase()

    if (isCorrectChoice) {
      setIsAnswered(true)
      playSound('correct')
      speakWord(currentWord.word)

      if (isFirstTryCorrect) {
        setScore(prev => prev + 1)
      }

      // Asynchronously update mastery level in DB
      if (!currentWord._id.startsWith('f')) {
        api.patch(`/vocabulary/${currentWord._id}`, { masteryLevel: 'learning' }).catch(() => {})
      }
    } else {
      playSound('wrong')
      setIsFirstTryCorrect(false)
      setAttempts(prev => prev + 1)
      // reset selectedOption after brief delay so user can try again
      setTimeout(() => setSelectedOption(null), 1000)
    }
  }

  const handleNextRound = () => {
    const nextIndex = currentRoundIndex + 1
    if (nextIndex >= words.length) {
      clearInterval(timerInterval.current)
      setGameState('victory')
      playSound('victory')
    } else {
      setCurrentRoundIndex(nextIndex)
      setupRound(words, nextIndex, words)
    }
  }

  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="filler-page animate-fade-in">
      {gameState === 'victory' && (
        <div className="confetti-container">
          {Array.from({ length: 40 }).map((_, i) => (
            <div 
              key={i} 
              className="confetti-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
                backgroundColor: `hsl(${Math.random() * 360}, 85%, 60%)`,
                width: `${Math.random() * 9 + 5}px`,
                height: `${Math.random() * 9 + 5}px`
              }}
            />
          ))}
        </div>
      )}

      {/* Config Screen */}
      {gameState === 'config' && (
        <div className="filler-card card-base config-panel">
          <div className="text-center config-header">
            <span className="material-symbols-outlined config-icon-filler">rate_review</span>
            <h2 className="text-headline-lg font-bold">{t('games.fillerTitle', 'Context Filler')}</h2>
            <p className="text-body-md text-secondary-color">
              {t('games.fillerDesc', 'Learn vocabulary in context! Read real-world sample sentences and choose the most appropriate word to complete each blank.')}
            </p>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">{t('games.fillerRounds', '1. Number of Questions')}</h4>
            <div className="round-selector">
              {[5, 10, 15].map((num) => (
                <button
                  key={num}
                  className={`round-btn-filler ${roundCount === num ? 'round-btn-filler--active' : ''}`}
                  onClick={() => setRoundCount(num)}
                >
                  {num} {t('onboarding.question', 'Questions')}
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">{t('games.matchingSelectCat', '2. Select Category (Optional)')}</h4>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="">{t('games.allCategories', 'All Categories')}</option>
              <option value="academic">Academic</option>
              <option value="business">Business</option>
              <option value="scientific">Scientific</option>
              <option value="daily">Daily Use</option>
            </select>
          </div>

          <button className="start-game-btn-filler" onClick={loadWords}>
            <span className="material-symbols-outlined">play_arrow</span>
            {t('games.startGame', 'Start Game')}
          </button>
        </div>
      )}

      {/* Loading Screen */}
      {gameState === 'loading' && (
        <div className="loading-panel text-center">
          <span className="material-symbols-outlined animate-spin loading-spinner">
            progress_activity
          </span>
          <p className="text-body-lg">{t('common.loading', 'Finding suitable contextual sentences...')}</p>
        </div>
      )}

      {/* Gameplay Screen */}
      {gameState === 'playing' && currentWord && (
        <div className="filler-gameplay-container">
          <div className="gameplay-header">
            <button className="back-btn" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">arrow_back</span>
              {t('common.exit', 'Exit')}
            </button>
            <div className="stats-row">
              <div className="stat-pill">
                <span className="material-symbols-outlined">schedule</span>
                <span>{formatTime(timer)}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{t('games.score', 'Score')}: {score} / {words.length}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">quiz</span>
                <span>{t('onboarding.question', 'Question')}: {currentRoundIndex + 1} / {words.length}</span>
              </div>
            </div>
          </div>

          <div className="filler-card-playing card-base">
            {/* Sentence box */}
            <div className="sentence-display-box">
              <p className="sentence-text">
                "{blankedSentence}"
              </p>
            </div>

            {/* Options grid */}
            <div className="options-grid">
              {options.map((opt, idx) => {
                const isSelected = selectedOption === opt
                const isCorrectAnswer = opt.toLowerCase() === currentWord.word.toLowerCase()
                
                let btnClass = ''
                if (isSelected) {
                  btnClass = isCorrectAnswer ? 'opt-btn--correct' : 'opt-btn--wrong'
                } else if (isAnswered && isCorrectAnswer) {
                  btnClass = 'opt-btn--correct'
                }

                return (
                  <button
                    key={idx}
                    className={`option-button-item ${btnClass}`}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isAnswered && !isCorrectAnswer}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + idx)}.</span>
                    <span className="option-text font-bold">{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Next step panel */}
            {isAnswered && (
              <div className="filler-next-panel text-center animate-scale-up">
                <p className="definition-explanation">
                  <strong>{currentWord.word}:</strong> {currentWord.definition}
                </p>
                <button className="next-round-btn-filler" onClick={handleNextRound}>
                  {t('games.fillerNext', 'Next Question')}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'victory' && (
        <div className="filler-card victory-panel card-base text-center">
          <div className="victory-crown">
            <span className="material-symbols-outlined crown-icon-filler">emoji_events</span>
          </div>
          <h2 className="text-headline-lg font-bold text-primary-color">{t('games.congratulations', 'Congratulations! Victory!')}</h2>
          <p className="text-body-md text-secondary-color">
            {t('games.fillerDesc', 'You successfully completed the Context Filler challenge!')}
          </p>

          <div className="score-summary-grid">
            <div className="summary-item">
              <span className="summary-value">{formatTime(timer)}</span>
              <span className="summary-label">{t('games.time', 'Time')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{score} / {words.length}</span>
              <span className="summary-label">{t('common.score', 'Score')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{Math.round((score / words.length) * 100)}%</span>
              <span className="summary-label">{t('games.accuracy', 'Accuracy')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">+{score * 12} XP</span>
              <span className="summary-label">{t('games.xpEarned', 'XP Earned')}</span>
            </div>
          </div>

          <div className="victory-actions">
            <button className="play-again-btn-filler" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">replay</span>
              {t('games.playAgain', 'Play Again')}
            </button>
            <button className="return-btn" onClick={() => navigate('/student/vocabulary')}>
              <span className="material-symbols-outlined">menu_book</span>
              {t('games.wordLibrary', 'Word Library')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
