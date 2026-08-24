import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './VocabHunter.css'

const FALLBACK_WORDS = [
  { _id: 'f1', word: 'Accolade', definition: 'An award or privilege granted as a special honor or as an acknowledgment of merit.' },
  { _id: 'f2', word: 'Benevolent', definition: 'Well meaning and kindly; serving a charitable purpose.' },
  { _id: 'f3', word: 'Capricious', definition: 'Given to sudden and unaccountable changes of mood or behavior.' },
  { _id: 'f4', word: 'Diligent', definition: 'Having or showing care and conscientiousness in one\'s work or duties.' },
  { _id: 'f5', word: 'Eloquent', definition: 'Fluent or persuasive in speaking or writing.' },
  { _id: 'f6', word: 'Frugal', definition: 'Sparing or economical with regard to money or food.' },
  { _id: 'f7', word: 'Garrulous', definition: 'Excessively talkative, especially on trivial matters.' },
  { _id: 'f8', word: 'Hypothesis', definition: 'A proposed explanation made on the basis of limited evidence.' },
  { _id: 'f9', word: 'Impeccable', definition: 'In accordance with the highest standards; faultless.' },
  { _id: 'f10', word: 'Jubilant', definition: 'Feeling or expressing great happiness and triumph.' }
]

export default function VocabHunter() {
  const navigate = useNavigate()

  // Game configuration
  const [gameState, setGameState] = useState('config') // 'config' | 'loading' | 'playing' | 'gameover' | 'victory'
  const [selectedCategory, setSelectedCategory] = useState('')
  const [speedLevel, setSpeedLevel] = useState('medium') // 'easy' | 'medium' | 'hard'

  // Word pool
  const [vocabPool, setVocabPool] = useState([])
  const [roundIndex, setRoundIndex] = useState(0)

  // Current playing state
  const [targetWord, setTargetWord] = useState(null)
  const [bubbles, setBubbles] = useState([]) // array of { id, word, x, y, isWrongClicked }
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)

  // Refs for loop
  const gameInterval = useRef(null)
  const speedRef = useRef(1.5)
  const livesRef = useRef(3)

  // Web Audio sounds
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
        osc.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08) // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
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
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
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
    setRoundIndex(0)
    
    // Set game speed
    if (speedLevel === 'easy') speedRef.current = 1.0
    else if (speedLevel === 'medium') speedRef.current = 1.6
    else speedRef.current = 2.4

    setupNextRound(pool, 0)
    setGameState('playing')
  }

  const setupNextRound = (pool, currentIdx) => {
    // Pick target word
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random())
    const target = shuffledPool[0]
    setTargetWord(target)

    // Generate bubbles: 1 correct + 3 incorrect
    const distractors = shuffledPool.slice(1, 4)
    const options = [target, ...distractors].sort(() => 0.5 - Math.random())

    // X coordinates to avoid layout overlap (columns at 12.5%, 37.5%, 62.5%, 87.5%)
    const xCoords = [10, 35, 60, 80].sort(() => 0.5 - Math.random())

    const generatedBubbles = options.map((opt, i) => ({
      id: i,
      wordObj: opt,
      x: xCoords[i],
      y: -50 - (Math.random() * 40), // slightly staggered vertical starts
      isWrongClicked: false
    }))

    setBubbles(generatedBubbles)
  }

  // Run the physics/game loop
  useEffect(() => {
    if (gameState === 'playing') {
      if (gameInterval.current) clearInterval(gameInterval.current)

      gameInterval.current = setInterval(() => {
        setBubbles((prevBubbles) => {
          let hasMissedCorrect = false
          let targetIsWord = ''
          
          const updated = prevBubbles.map((b) => {
            const nextY = b.y + speedRef.current
            
            // Check if correct bubble reaches the bottom (height threshold e.g. 390px)
            if (nextY >= 390 && b.wordObj._id === targetWord?._id && !hasMissedCorrect) {
              hasMissedCorrect = true
              targetIsWord = b.wordObj.word
            }
            return { ...b, y: nextY }
          })

          if (hasMissedCorrect) {
            // Player missed the correct bubble!
            playSound('lose-life')
            const nextLives = livesRef.current - 1
            livesRef.current = nextLives
            setLives(nextLives)

            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel()
              const u = new SpeechSynthesisUtterance(`Missed: ${targetIsWord}`)
              u.lang = 'en-US'
              u.rate = 0.95
              window.speechSynthesis.speak(u)
            }

            if (nextLives <= 0) {
              clearInterval(gameInterval.current)
              setGameState('gameover')
              return []
            } else {
              // Reset with new round
              setTimeout(() => {
                setRoundIndex((r) => {
                  const nextR = r + 1
                  if (nextR >= 15) {
                    clearInterval(gameInterval.current)
                    setGameState('victory')
                    playSound('victory')
                  } else {
                    // Increase speed slightly
                    speedRef.current += 0.1
                    setupNextRound(vocabPool, nextR)
                  }
                  return nextR
                })
              }, 10)
              return []
            }
          }

          return updated
        })
      }, 30)
    } else {
      if (gameInterval.current) clearInterval(gameInterval.current)
    }

    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current)
    }
  }, [gameState, targetWord, vocabPool])

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  // Handle clicking bubble
  const handleBubbleClick = (bubbleId, isCorrectChoice, wordText) => {
    if (gameState !== 'playing') return

    if (isCorrectChoice) {
      playSound('correct')
      speakWord(wordText)
      setScore((prev) => prev + 1)
      
      // Update mastery level in DB
      const bubble = bubbles.find(b => b.id === bubbleId)
      if (bubble && bubble.wordObj && !bubble.wordObj._id.startsWith('f')) {
        api.patch(`/vocabulary/${bubble.wordObj._id}`, { masteryLevel: 'learning' }).catch(() => {})
      }

      // Next round
      setRoundIndex((r) => {
        const nextR = r + 1
        if (nextR >= 15) {
          clearInterval(gameInterval.current)
          setGameState('victory')
          playSound('victory')
        } else {
          speedRef.current += 0.12 // increase speed
          setupNextRound(vocabPool, nextR)
        }
        return nextR
      })
    } else {
      playSound('wrong')
      // Mark bubble as wrong clicked so it turns red
      setBubbles((prev) =>
        prev.map((b) => (b.id === bubbleId ? { ...b, isWrongClicked: true } : b))
      )
      
      // Deduct score or lives (let's deduct score by 1 and trigger wrong visual)
      setScore((prev) => Math.max(0, prev - 1))
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="hunter-page animate-fade-in">
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
        <div className="hunter-card card-base config-panel">
          <div className="text-center config-header">
            <span className="material-symbols-outlined config-icon-hunter">target</span>
            <h2 className="text-headline-lg font-bold">Vocab Hunter</h2>
            <p className="text-body-md text-secondary-color">
              Thử thách phản xạ nhanh! Đọc định nghĩa ở đầu màn hình và nhanh chóng bắn hạ bong bóng chứa từ vựng tương ứng đang rơi xuống trước khi chúng biến mất!
            </p>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">1. Chọn tốc độ rơi</h4>
            <div className="speed-selector">
              {[
                { id: 'easy', label: 'Chậm', desc: 'Luyện tập' },
                { id: 'medium', label: 'Vừa', desc: 'Thường' },
                { id: 'hard', label: 'Nhanh', desc: 'Thử thách' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  className={`speed-btn ${speedLevel === lvl.id ? 'speed-btn--active' : ''}`}
                  onClick={() => setSpeedLevel(lvl.id)}
                >
                  <span className="speed-title">{lvl.label}</span>
                  <span className="speed-desc">{lvl.desc}</span>
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

          <button className="start-game-btn-hunter" onClick={loadVocabulary}>
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
          <p className="text-body-lg">Đang nạp bong bóng từ vựng...</p>
        </div>
      )}

      {/* Gameplay Screen */}
      {gameState === 'playing' && targetWord && (
        <div className="hunter-gameplay-container">
          <div className="gameplay-header">
            <button className="back-btn" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">arrow_back</span>
              Thoát
            </button>
            <div className="stats-row">
              <div className="lives-display">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined heart-icon"
                    style={{ color: i < lives ? '#E53935' : '#B0BEC5', fontVariationSettings: i < lives ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                ))}
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">sports_score</span>
                <span>Điểm số: {score}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">tour</span>
                <span>Vòng: {roundIndex + 1} / 15</span>
              </div>
            </div>
          </div>

          {/* Target Definition Box */}
          <div className="target-definition-box text-center card-base">
            <span className="definition-tag-hunter">Định nghĩa cần tìm:</span>
            <p className="definition-phrase font-medium">"{targetWord.definition}"</p>
          </div>

          {/* Falling Bubbles Canvas Area */}
          <div className="hunter-canvas-area">
            {bubbles.map((b) => {
              const isCorrectChoice = b.wordObj._id === targetWord._id
              return (
                <button
                  key={b.id}
                  className={`word-bubble ${b.isWrongClicked ? 'bubble-wrong animate-shake' : ''}`}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}px`
                  }}
                  onClick={() => handleBubbleClick(b.id, isCorrectChoice, b.wordObj.word)}
                >
                  <span className="bubble-text">{b.wordObj.word}</span>
                </button>
              )
            })}
            
            {/* Safe zone boundary indicator */}
            <div className="danger-zone-line" />
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="hunter-card gameover-panel card-base text-center">
          <div className="gameover-icon-wrap">
            <span className="material-symbols-outlined skull-icon">heart_broken</span>
          </div>
          <h2 className="text-headline-lg font-bold text-error">Rất Tiếc, Trò Chơi Kết Thúc!</h2>
          <p className="text-body-md text-secondary-color">
            Bạn đã hết lượt chơi (mất cả 3 mạng). Hãy cố gắng tập trung và thử lại nhé!
          </p>

          <div className="score-summary-grid">
            <div className="summary-item">
              <span className="summary-value">{score}</span>
              <span className="summary-label">Từ đã bắn</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">+{score * 5} XP</span>
              <span className="summary-label">XP tích lũy</span>
            </div>
          </div>

          <div className="victory-actions">
            <button className="play-again-btn-hunter" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">replay</span>
              Thử lại
            </button>
            <button className="return-btn" onClick={() => navigate('/student/vocabulary')}>
              <span className="material-symbols-outlined">menu_book</span>
              Thư viện
            </button>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'victory' && (
        <div className="hunter-card victory-panel card-base text-center">
          <div className="victory-crown">
            <span className="material-symbols-outlined crown-icon">emoji_events</span>
          </div>
          <h2 className="text-headline-lg font-bold text-primary-color">Thợ Săn Từ Vựng Vĩ Đại!</h2>
          <p className="text-body-md text-secondary-color">
            Bạn đã xuất sắc vượt qua toàn bộ 15 vòng chơi đầy kịch tính!
          </p>

          <div className="score-summary-grid">
            <div className="summary-item">
              <span className="summary-value">{score}</span>
              <span className="summary-label">Điểm số</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">+{score * 20} XP</span>
              <span className="summary-label">XP đạt được</span>
            </div>
          </div>

          <div className="victory-actions">
            <button className="play-again-btn-hunter" onClick={() => setGameState('config')}>
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
