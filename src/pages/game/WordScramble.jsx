import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './WordScramble.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'Evaluate', definition: 'Form an idea of the amount, number, or value of; assess.', partOfSpeech: 'verb', ipa: '/ɪˈvæljueɪt/' },
  { _id: 'f2', word: 'Synthesize', definition: 'Combine a number of things into a coherent whole.', partOfSpeech: 'verb', ipa: '/ˈsɪnθəsaɪz/' },
  { _id: 'f3', word: 'Significant', definition: 'Sufficiently great or important to be worthy of attention; noteworthy.', partOfSpeech: 'adjective', ipa: '/sɪɡˈnɪfɪkənt/' },
  { _id: 'f4', word: 'Empirical', definition: 'Based on, concerned with, or verifiable by observation or experience rather than theory.', partOfSpeech: 'adjective', ipa: '/ɪmˈpɪrɪkl/' },
  { _id: 'f5', word: 'Methodology', definition: 'A system of methods used in a particular area of study or activity.', partOfSpeech: 'noun', ipa: '/ˌmeθəˈdɒlədʒi/' }
]

export default function WordScramble() {
  const navigate = useNavigate()
  
  // Game state
  const [gameState, setGameState] = useState('config') // 'config' | 'loading' | 'playing' | 'victory'
  const [roundCount, setRoundCount] = useState(5)
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // Word list state
  const [words, setWords] = useState([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  
  // Current playing word state
  const [currentWordObj, setCurrentWordObj] = useState(null)
  const [scrambledWord, setScrambledWord] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(null) // null | true | false
  const [attempts, setAttempts] = useState(0)
  const [hintLevel, setHintLevel] = useState(0) // 0: no hint, 1: show first letter, 2: show first & last letters
  const [score, setScore] = useState(0)
  const [skips, setSkips] = useState(0)
  
  // Stats
  const [timer, setTimer] = useState(0)
  const timerInterval = useRef(null)

  // Web Audio Context sound effects
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
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1) // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(150, ctx.currentTime)
        osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      } else if (type === 'victory') {
        const now = ctx.currentTime
        const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(freq, now + i * 0.1)
          g.gain.setValueAtTime(0.1, now + i * 0.1)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3)
          o.start(now + i * 0.1)
          o.stop(now + i * 0.1 + 0.35)
        })
      }
    } catch (e) {
      console.warn('Audio Context error:', e)
    }
  }

  // Scramble function
  const scramble = (word) => {
    const letters = word.split('')
    let scrambled = ''
    let safetyCounter = 0
    
    // Shuffle letters until scrambled word is different from original
    do {
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]]
      }
      scrambled = letters.join('')
      safetyCounter++
    } while (scrambled.toLowerCase() === word.toLowerCase() && safetyCounter < 50)
    
    return scrambled.toUpperCase()
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

      // Shuffle and pick roundCount words
      const selection = [...loaded].sort(() => 0.5 - Math.random()).slice(0, Math.min(roundCount, loaded.length))
      setWords(selection)
      
      // Init gameplay variables
      setCurrentRoundIndex(0)
      setScore(0)
      setSkips(0)
      setTimer(0)
      
      setupRound(selection, 0)
      setGameState('playing')

      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } catch (e) {
      console.error(e)
      const selection = [...FALLBACK_WORDS].slice(0, Math.min(roundCount, FALLBACK_WORDS.length))
      setWords(selection)
      setCurrentRoundIndex(0)
      setScore(0)
      setSkips(0)
      setTimer(0)
      setupRound(selection, 0)
      setGameState('playing')
    }
  }

  const setupRound = (roundWords, index) => {
    const wordObj = roundWords[index]
    setCurrentWordObj(wordObj)
    setScrambledWord(scramble(wordObj.word))
    setUserInput('')
    setIsCorrect(null)
    setAttempts(0)
    setHintLevel(0)
  }

  const handleSpeak = () => {
    if (!currentWordObj) return
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(currentWordObj.word)
      u.lang = 'en-US'
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  const handleVerify = (e) => {
    e?.preventDefault()
    if (!userInput.trim()) return

    const sanitizedInput = userInput.trim().toLowerCase()
    const correctWord = currentWordObj.word.trim().toLowerCase()
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)

    if (sanitizedInput === correctWord) {
      setIsCorrect(true)
      setScore(prev => prev + 1)
      playSound('correct')
      handleSpeak()

      // Asynchronously update DB mastery level
      if (!currentWordObj._id.startsWith('f')) {
        api.patch(`/vocabulary/${currentWordObj._id}`, { masteryLevel: 'learning' }).catch(() => {})
      }
    } else {
      setIsCorrect(false)
      playSound('wrong')
      setTimeout(() => setIsCorrect(null), 1000)
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
      setupRound(words, nextIndex)
    }
  }

  const handleSkipRound = () => {
    setSkips(prev => prev + 1)
    setIsCorrect(true) // Treat as answered to show the correct word
    setUserInput(currentWordObj.word)
    handleSpeak()
  }

  const getHint = () => {
    if (hintLevel < 2) {
      setHintLevel(prev => prev + 1)
    }
  }

  const renderHintText = () => {
    const w = currentWordObj.word
    if (hintLevel === 0) return ''
    if (hintLevel === 1) return `Gợi ý: Từ bắt đầu bằng chữ "${w[0].toUpperCase()}"`
    return `Gợi ý: Từ bắt đầu bằng chữ "${w[0].toUpperCase()}" và kết thúc bằng chữ "${w[w.length - 1].toUpperCase()}"`
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
    <div className="scramble-page animate-fade-in">
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
                width: `${Math.random() * 8 + 6}px`,
                height: `${Math.random() * 8 + 6}px`
              }}
            />
          ))}
        </div>
      )}

      {/* Config Screen */}
      {gameState === 'config' && (
        <div className="scramble-card card-base config-panel">
          <div className="text-center config-header">
            <span className="material-symbols-outlined config-icon-scramble">spellcheck</span>
            <h2 className="text-headline-lg font-bold">Word Scramble</h2>
            <p className="text-body-md text-secondary-color">
              Xây dựng phản xạ chính tả! Sắp xếp các chữ cái xáo trộn thành một từ hoàn chỉnh dựa trên gợi ý từ loại, IPA và định nghĩa.
            </p>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">1. Số lượt chơi (Số từ)</h4>
            <div className="round-selector">
              {[5, 10, 15].map((num) => (
                <button
                  key={num}
                  className={`round-btn ${roundCount === num ? 'round-btn--active' : ''}`}
                  onClick={() => setRoundCount(num)}
                >
                  {num} Từ
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">2. Chọn chủ đề học (Tùy chọn)</h4>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="">Tất cả chủ đề</option>
              <option value="academic">Academic (Học thuật)</option>
              <option value="business">Business (Kinh doanh)</option>
              <option value="scientific">Scientific (Khoa học)</option>
              <option value="daily">Daily Use (Thường ngày)</option>
            </select>
          </div>

          <button className="start-game-btn" onClick={loadWords}>
            <span className="material-symbols-outlined">play_arrow</span>
            Bắt đầu chơi
          </button>
        </div>
      )}

      {/* Loading Screen */}
      {gameState === 'loading' && (
        <div className="loading-panel text-center">
          <span className="material-symbols-outlined animate-spin loading-spinner">
            progress_activity
          </span>
          <p className="text-body-lg">Đang tạo bộ câu hỏi...</p>
        </div>
      )}

      {/* Gameplay Screen */}
      {gameState === 'playing' && currentWordObj && (
        <div className="scramble-gameplay-container">
          <div className="gameplay-header">
            <button className="back-btn" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">arrow_back</span>
              Thoát
            </button>
            <div className="stats-row">
              <div className="stat-pill">
                <span className="material-symbols-outlined">schedule</span>
                <span>{formatTime(timer)}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Điểm số: {score} / {words.length}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">quiz</span>
                <span>Từ thứ: {currentRoundIndex + 1} / {words.length}</span>
              </div>
            </div>
          </div>

          <div className="scramble-card-playing card-base">
            {/* Scrambled word display */}
            <div className="scrambled-letters-container">
              {scrambledWord.split('').map((letter, idx) => (
                <span key={idx} className="letter-badge">{letter}</span>
              ))}
            </div>

            {/* Clues */}
            <div className="clues-panel">
              <div className="clue-tag-row">
                {currentWordObj.partOfSpeech && (
                  <span className="clue-tag part-of-speech">{currentWordObj.partOfSpeech}</span>
                )}
                {currentWordObj.ipa && (
                  <span className="clue-tag ipa">{currentWordObj.ipa}</span>
                )}
              </div>
              <p className="clue-definition">
                <strong>Định nghĩa:</strong> {currentWordObj.definition}
              </p>
              {hintLevel > 0 && (
                <p className="clue-hint-text text-label-md">{renderHintText()}</p>
              )}
            </div>

            {/* User interaction */}
            {isCorrect === true ? (
              <div className="result-success-panel text-center">
                <span className="material-symbols-outlined check-icon-success">check_circle</span>
                <h4 className="text-title-lg font-bold text-success">Hoàn toàn chính xác!</h4>
                <p className="text-body-md font-medium">Từ đúng: <span className="text-primary-color font-bold">{currentWordObj.word}</span></p>
                <button className="next-round-btn" onClick={handleNextRound}>
                  Từ tiếp theo
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            ) : (
              <form className="scramble-form" onSubmit={handleVerify}>
                <input
                  type="text"
                  placeholder="Gõ từ đã sắp xếp tại đây..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className={`scramble-input ${isCorrect === false ? 'shake-animation border-error' : ''}`}
                  autoFocus
                  disabled={isCorrect === true}
                />
                
                <div className="scramble-actions">
                  <button type="submit" className="submit-btn" disabled={!userInput.trim()}>
                    Kiểm tra
                  </button>
                  <button type="button" className="hint-btn" onClick={getHint} disabled={hintLevel >= 2}>
                    <span className="material-symbols-outlined">emoji_objects</span>
                    Gợi ý
                  </button>
                  <button type="button" className="skip-btn" onClick={handleSkipRound}>
                    Bỏ qua
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'victory' && (
        <div className="scramble-card victory-panel card-base text-center">
          <div className="victory-crown">
            <span className="material-symbols-outlined crown-icon-scramble">emoji_events</span>
          </div>
          <h2 className="text-headline-lg font-bold text-primary-color">Chúc Mừng Chiến Thắng!</h2>
          <p className="text-body-md text-secondary-color">
            Bạn đã xuất sắc chinh phục thử thách sắp xếp chữ cái!
          </p>

          <div className="score-summary-grid">
            <div className="summary-item">
              <span className="summary-value">{formatTime(timer)}</span>
              <span className="summary-label">Thời gian</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{score} / {words.length}</span>
              <span className="summary-label">Đúng chính tả</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{skips}</span>
              <span className="summary-label">Từ bỏ qua</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">+{score * 15} XP</span>
              <span className="summary-label">XP đạt được</span>
            </div>
          </div>

          <div className="victory-actions">
            <button className="play-again-btn" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">replay</span>
              Chơi lại
            </button>
            <button className="return-btn" onClick={() => navigate('/student/vocabulary')}>
              <span className="material-symbols-outlined">menu_book</span>
              Thư viện từ vựng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
