import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './WordMatching.css'

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

export default function WordMatching() {
  const navigate = useNavigate()
  
  // Game Configuration State
  const [gameState, setGameState] = useState('config') // 'config' | 'loading' | 'playing' | 'victory'
  const [pairCount, setPairCount] = useState(6) // 6 | 8 | 10
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // Vocabulary Source State
  const [vocabList, setVocabList] = useState([])
  
  // Gameplay State
  const [cards, setCards] = useState([])
  const [selectedCards, setSelectedCards] = useState([]) // indices of selected cards
  const [matchedPairs, setMatchedPairs] = useState([]) // ids of matched words
  const [attempts, setAttempts] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  
  // Timer State
  const [timer, setTimer] = useState(0)
  const timerInterval = useRef(null)

  // Web Audio Context for sound effects
  const playSoundEffect = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      if (type === 'match') {
        // High pleasant pitch chime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else if (type === 'mismatch') {
        // Low double-beep buzz
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle'
        
        osc.frequency.setValueAtTime(220, ctx.currentTime) // A3
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15)
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else if (type === 'victory') {
        // Success melody
        const now = ctx.currentTime
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50] // C4, E4, G4, C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + idx * 0.08)
          gain.gain.setValueAtTime(0.1, now + idx * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25)
          osc.start(now + idx * 0.08)
          osc.stop(now + idx * 0.08 + 0.3)
        })
      }
    } catch (err) {
      console.warn('Audio Context failed to load or start:', err)
    }
  }

  // Load vocabulary based on category
  const loadVocabulary = async () => {
    setGameState('loading')
    try {
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
      const response = await api.get(`/vocabulary?limit=150${categoryParam}`)
      
      let sourceWords = []
      if (response.success && response.data && response.data.length > 0) {
        sourceWords = response.data
      } else {
        // Use fallbacks if no database vocabulary is available
        sourceWords = FALLBACK_WORDS
      }

      setVocabList(sourceWords)
      startGame(sourceWords)
    } catch (err) {
      console.error('Failed to load words, starting with fallback:', err)
      setVocabList(FALLBACK_WORDS)
      startGame(FALLBACK_WORDS)
    }
  }

  // Start game with loaded words list
  const startGame = (words) => {
    // 1. Select random set of words
    const shuffled = [...words].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(pairCount, shuffled.length))
    
    // 2. Generate double cards: Word Cards & Definition Cards
    const cardPairs = []
    selected.forEach((wordObj) => {
      // Word Card
      cardPairs.push({
        id: `${wordObj._id}-word`,
        wordId: wordObj._id,
        type: 'word',
        content: wordObj.word,
        ipa: wordObj.ipa
      })
      // Definition Card
      cardPairs.push({
        id: `${wordObj._id}-def`,
        wordId: wordObj._id,
        type: 'def',
        content: wordObj.definition
      })
    })

    // 3. Shuffle all cards
    const shuffledCards = cardPairs.sort(() => 0.5 - Math.random())
    setCards(shuffledCards)
    
    // Reset game states
    setSelectedCards([])
    setMatchedPairs([])
    setAttempts(0)
    setAccuracy(100)
    setTimer(0)
    setGameState('playing')

    // Start timer
    if (timerInterval.current) clearInterval(timerInterval.current)
    timerInterval.current = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)
  }

  // Handle TTS for matched word
  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  // Handle card click
  const handleCardClick = (index) => {
    // Ignore clicks if already 2 cards selected, or card is already matched, or clicked card is already selected
    if (
      selectedCards.length >= 2 || 
      matchedPairs.includes(cards[index].wordId) || 
      selectedCards.includes(index)
    ) {
      return
    }

    const newSelected = [...selectedCards, index]
    setSelectedCards(newSelected)

    // Check match when two cards are selected
    if (newSelected.length === 2) {
      const firstCard = cards[newSelected[0]]
      const secondCard = cards[newSelected[1]]
      
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (firstCard.wordId === secondCard.wordId) {
        // MATCH FOUND!
        const nextMatched = [...matchedPairs, firstCard.wordId]
        setMatchedPairs(nextMatched)
        setSelectedCards([])
        playSoundEffect('match')
        
        // Speak word
        const targetWord = firstCard.type === 'word' ? firstCard.content : secondCard.content
        speakWord(targetWord)

        // Try to update mastery level in DB asynchronously (ignore errors for fallbacks)
        if (!firstCard.wordId.startsWith('f')) {
          api.patch(`/vocabulary/${firstCard.wordId}`, { masteryLevel: 'learning' }).catch(() => {})
        }

        // Recalculate accuracy
        setAccuracy(Math.round((nextMatched.length / newAttempts) * 100))

        // Check Victory
        if (nextMatched.length === pairCount) {
          clearInterval(timerInterval.current)
          setGameState('victory')
          playSoundEffect('victory')
        }
      } else {
        // MISMATCH
        playSoundEffect('mismatch')
        setAccuracy(Math.round((matchedPairs.length / newAttempts) * 100))
        setTimeout(() => {
          setSelectedCards([])
        }, 1000)
      }
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  // Format time (seconds -> mm:ss)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="word-match-page animate-fade-in">
      {/* Background Confetti when Victorious */}
      {gameState === 'victory' && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, idx) => {
            const delay = Math.random() * 5
            const left = Math.random() * 100
            const rotation = Math.random() * 360
            const size = Math.random() * 10 + 6
            const hue = Math.random() * 360
            return (
              <div 
                key={idx} 
                className="confetti-particle"
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  transform: `rotate(${rotation}deg)`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: `hsl(${hue}, 80%, 60%)`
                }}
              />
            )
          })}
        </div>
      )}

      {/* Screen 1: Configuration */}
      {gameState === 'config' && (
        <div className="match-card config-panel card-base">
          <div className="config-header text-center">
            <span className="material-symbols-outlined config-icon">extension</span>
            <h2 className="text-headline-lg font-bold">Word Matching Game</h2>
            <p className="text-body-md text-secondary-color">
              Challenge your memory! Match English vocabulary words with their correct definitions.
            </p>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">1. Select Number of Word Pairs</h4>
            <div className="pair-count-selector">
              {[6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`pair-btn ${pairCount === num ? 'pair-btn--active' : ''}`}
                  onClick={() => setPairCount(num)}
                >
                  <span className="pair-number">{num}</span>
                  <span className="pair-label">{num * 2} Cards</span>
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h4 className="text-title-md font-medium">2. Select Category (Optional)</h4>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="">All Categories</option>
              <option value="academic">Academic</option>
              <option value="business">Business</option>
              <option value="scientific">Scientific</option>
              <option value="daily">Daily Use</option>
            </select>
          </div>

          <button className="start-game-btn" onClick={loadVocabulary}>
            <span className="material-symbols-outlined">play_arrow</span>
            Start Game
          </button>
        </div>
      )}

      {/* Screen 2: Loading */}
      {gameState === 'loading' && (
        <div className="loading-panel text-center">
          <span className="material-symbols-outlined animate-spin loading-spinner">
            progress_activity
          </span>
          <p className="text-body-lg">Loading and preparing vocabulary cards...</p>
        </div>
      )}

      {/* Screen 3: Playing */}
      {gameState === 'playing' && (
        <div className="gameplay-container">
          {/* Header Stats */}
          <div className="gameplay-header">
            <button className="back-btn" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">arrow_back</span>
              Exit
            </button>
            <div className="stats-row">
              <div className="stat-pill">
                <span className="material-symbols-outlined">schedule</span>
                <span>{formatTime(timer)}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">percent</span>
                <span>Accuracy: {accuracy}%</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">fitness_center</span>
                <span>Attempts: {attempts}</span>
              </div>
              <div className="stat-pill">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Matched: {matchedPairs.length} / {pairCount}</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className={`cards-grid grid-cols-${pairCount <= 6 ? '4' : '5'}`}>
            {cards.map((card, idx) => {
              const isSelected = selectedCards.includes(idx)
              const isMatched = matchedPairs.includes(card.wordId)
              const isFlipped = isSelected || isMatched

              return (
                <div
                  key={card.id}
                  className={`match-card-item ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${card.type}`}
                  onClick={() => handleCardClick(idx)}
                >
                  <div className="card-inner">
                    {/* Front of card (Hidden word/def - Face Down) */}
                    <div className="card-face card-front">
                      <span className="material-symbols-outlined card-logo">auto_stories</span>
                    </div>

                    {/* Back of card (Revealed word/def - Face Up) */}
                    <div className={`card-face card-back ${card.type}`}>
                      <div className="card-content-wrapper">
                        {card.type === 'word' ? (
                          <>
                            <span className="card-type-indicator">Word</span>
                            <span className="word-text font-bold">{card.content}</span>
                            {card.ipa && <span className="word-ipa">{card.ipa}</span>}
                          </>
                        ) : (
                          <>
                            <span className="card-type-indicator">Definition</span>
                            <p className="definition-text">{card.content}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Screen 4: Victory */}
      {gameState === 'victory' && (
        <div className="match-card victory-panel card-base text-center">
          <div className="victory-crown">
            <span className="material-symbols-outlined crown-icon">emoji_events</span>
          </div>
          <h2 className="text-headline-lg font-bold text-primary-color">Congratulations! Victory!</h2>
          <p className="text-body-md text-secondary-color">
            You successfully matched all vocabulary cards!
          </p>

          <div className="score-summary-grid">
            <div className="summary-item">
              <span className="summary-value">{formatTime(timer)}</span>
              <span className="summary-label">Time</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{accuracy}%</span>
              <span className="summary-label">Accuracy</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{attempts}</span>
              <span className="summary-label">Attempts</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">+{pairCount * 10} XP</span>
              <span className="summary-label">XP Earned</span>
            </div>
          </div>

          <div className="victory-actions">
            <button className="play-again-btn" onClick={() => setGameState('config')}>
              <span className="material-symbols-outlined">replay</span>
              Play Again
            </button>
            <button className="return-btn" onClick={() => navigate('/student/vocabulary')}>
              <span className="material-symbols-outlined">menu_book</span>
              Word Library
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
