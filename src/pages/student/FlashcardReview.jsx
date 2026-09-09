import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api.js'
import './FlashcardReview.css'

export default function FlashcardReview() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')

  // Cards state
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [loading, setLoading] = useState(true)

  // Slide animation state
  const [cardAnim, setCardAnim] = useState('') // '' | 'exiting' | 'entering'
  const animTimeout = useRef(null)

  // Session result tracking: { again, hard, good, easy }
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  // Load cards due for review today via SRS endpoint
  useEffect(() => {
    async function loadCards() {
      try {
        setLoading(true)
        const categoryParam = categoryFilter ? `&category=${categoryFilter}` : ''
        const res = await api.get(`/vocabulary/due-today?limit=50${categoryParam}`)
        setCards(res.data.data || [])
      } catch (err) {
        console.error('Error loading flashcards:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCards()

    return () => {
      // Cleanup speech on unmount
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      if (animTimeout.current) clearTimeout(animTimeout.current)
    }
  }, [categoryFilter])

  const currentCard = cards[currentIndex]
  const totalCards  = cards.length
  const progressPct = totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0
  const newCount      = cards.filter(c => c.masteryLevel === 'new').length
  const learningCount = cards.filter(c => c.masteryLevel === 'learning').length

  // ── Voice: pronounce word ──
  const handleSpeak = useCallback((e) => {
    e?.stopPropagation()
    if (!currentCard) return
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(currentCard.word)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }, [currentCard])

  // ── Flip card ──
  const handleFlip = (e) => {
    e?.stopPropagation()
    setIsFlipped(prev => !prev)
  }

  // ── Move to next card with animation ──
  const goToNext = useCallback(() => {
    setCardAnim('exiting')
    animTimeout.current = setTimeout(() => {
      setIsFlipped(false)
      const next = currentIndex + 1
      if (next >= totalCards) {
        setIsDone(true)
      } else {
        setCurrentIndex(next)
        setCardAnim('entering')
        animTimeout.current = setTimeout(() => setCardAnim(''), 280)
      }
    }, 280)
  }, [currentIndex, totalCards])

  // ── SRS rating handler ──
  const handleRate = async (rating) => {
    if (!currentCard) return
    const ratingKey = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[rating]
    try {
      await api.post('/vocabulary/review', { wordId: currentCard._id, rating })
      setSessionStats(prev => ({ ...prev, [ratingKey]: prev[ratingKey] + 1 }))
    } catch (err) {
      console.error('Error submitting review:', err)
    }
    goToNext()
  }

  // ── Previous card ──
  const handlePrev = () => {
    if (currentIndex === 0) return
    setIsFlipped(false)
    setCurrentIndex(prev => prev - 1)
  }

  // ── Skip (without rating) ──
  const handleSkip = () => {
    goToNext()
  }

  // Restart session
  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsDone(false)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 })
    setCardAnim('')
  }

  // ── Mastery badge text ──
  const getMasteryLabel = (mastery) => {
    if (mastery === 'mastered') return 'Mastered'
    if (mastery === 'learning') return 'Learning'
    return 'New'
  }

  // ══════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flashcard-page">
        <div className="flashcard-page__loading">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <p className="text-body-md">Loading review flashcards...</p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════
  // EMPTY: no cards due for review
  // ══════════════════════════════════════════════
  if (!loading && totalCards === 0) {
    return (
      <div className="flashcard-page">
        {/* Header */}
        <header className="flashcard-page__header">
          <button className="flashcard-page__back-btn" onClick={() => navigate('/student/vocabulary')}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Vocabulary
          </button>
          <span className="flashcard-page__title">Flashcard Review</span>
          <span className="flashcard-page__counter" />
        </header>

        <div className="flashcard-page__empty">
          <div className="flashcard-page__empty-icon">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <h2 className="text-headline-md" style={{ color: 'var(--color-on-surface)' }}>
            All caught up! 🎉
          </h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
            No words are due for review today. Come back tomorrow or add more words to your vocabulary library!
          </p>
          <button
            className="flashcard-complete__btn flashcard-complete__btn--primary"
            onClick={() => navigate('/student/vocabulary')}
          >
            <span className="material-symbols-outlined">menu_book</span>
            Go to My Vocabulary
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════
  // COMPLETION SCREEN
  // ══════════════════════════════════════════════
  if (isDone) {
    return (
      <div className="flashcard-page">
        <header className="flashcard-page__header">
          <button className="flashcard-page__back-btn" onClick={() => navigate('/student/vocabulary')}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Vocabulary
          </button>
          <span className="flashcard-page__title">Session Complete</span>
          <span className="flashcard-page__counter" />
        </header>

        <div className="flashcard-complete">
          <div className="flashcard-complete__icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              celebration
            </span>
          </div>
          <h2 className="flashcard-complete__title">Great Session!</h2>
          <p className="flashcard-complete__subtitle">
            You reviewed all <strong>{totalCards}</strong> flashcards. Keep reviewing regularly to move words to Mastered!
          </p>

          {/* Session stats */}
          <div className="flashcard-complete__stats">
            <div className="flashcard-complete__stat">
              <p className="flashcard-complete__stat-num" style={{ color: 'var(--color-danger)' }}>
                {sessionStats.again}
              </p>
              <p className="flashcard-complete__stat-label">Again</p>
            </div>
            <div className="flashcard-complete__stat">
              <p className="flashcard-complete__stat-num" style={{ color: 'var(--color-warning)' }}>
                {sessionStats.hard}
              </p>
              <p className="flashcard-complete__stat-label">Hard</p>
            </div>
            <div className="flashcard-complete__stat">
              <p className="flashcard-complete__stat-num" style={{ color: 'var(--color-primary)' }}>
                {sessionStats.good}
              </p>
              <p className="flashcard-complete__stat-label">Good</p>
            </div>
            <div className="flashcard-complete__stat">
              <p className="flashcard-complete__stat-num" style={{ color: 'var(--color-success)' }}>
                {sessionStats.easy}
              </p>
              <p className="flashcard-complete__stat-label">Easy</p>
            </div>
            <div className="flashcard-complete__stat">
              <p className="flashcard-complete__stat-num" style={{ color: 'var(--color-primary)' }}>
                {totalCards}
              </p>
              <p className="flashcard-complete__stat-label">Total Reviewed</p>
            </div>
          </div>

          <div className="flashcard-complete__actions">
            <button className="flashcard-complete__btn flashcard-complete__btn--outline" onClick={handleRestart}>
              <span className="material-symbols-outlined">replay</span>
              Review Again
            </button>
            <button className="flashcard-complete__btn flashcard-complete__btn--primary" onClick={() => navigate('/student/vocabulary')}>
              <span className="material-symbols-outlined">menu_book</span>
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════
  // MAIN REVIEW SCREEN
  // ══════════════════════════════════════════════
  return (
    <div className="flashcard-page">
      {/* ── Header ── */}
      <header className="flashcard-page__header">
        <button className="flashcard-page__back-btn" onClick={() => navigate('/student/vocabulary')}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Vocabulary
        </button>
        <span className="flashcard-page__title">Flashcard Review</span>
        <span className="flashcard-page__counter">
          {currentIndex + 1} / {totalCards}
        </span>
      </header>

      {/* ── Progress bar ── */}
      <div className="flashcard-page__progress-wrap">
        <div className="flashcard-page__progress-info">
          <div className="flashcard-page__progress-pills">
            {learningCount > 0 && (
              <span className="flashcard-page__pill flashcard-page__pill--learning">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>school</span>
                Learning: {learningCount}
              </span>
            )}
            {newCount > 0 && (
              <span className="flashcard-page__pill flashcard-page__pill--new">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>new_releases</span>
                New: {newCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-outline)', fontWeight: 500 }}>
            {progressPct}% done
          </span>
        </div>
        <div className="flashcard-page__progress-bar">
          <div
            className="flashcard-page__progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <main className="flashcard-page__body">

        {/* ── 3D Flashcard ── */}
        <div
          className={`flashcard-scene ${
            cardAnim === 'exiting'  ? 'flashcard-scene--exiting'  :
            cardAnim === 'entering' ? 'flashcard-scene--entering' : ''
          }`}
          style={{ height: '480px', minHeight: '480px' }}
          onClick={handleFlip}
          role="button"
          aria-label="Click to flip card"
        >
          <div className={`flashcard-inner ${isFlipped ? 'flashcard-inner--flipped' : ''}`}>

            {/* ═══ FRONT ═══ */}
            <div className="flashcard-face flashcard-face--front">
              {/* Mastery badge */}
              <span className={`flashcard-mastery-badge flashcard-mastery-badge--${currentCard.masteryLevel}`}>
                {getMasteryLabel(currentCard.masteryLevel)}
              </span>

              {/* Word + voice button */}
              <div className="flashcard-word-row">
                <span className="flashcard-word">{currentCard.word}</span>
                <button
                  className="flashcard-voice-btn"
                  onClick={handleSpeak}
                  title="Pronounce word"
                  aria-label="Play pronunciation"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    volume_up
                  </span>
                </button>
              </div>

              {/* Part of speech + IPA */}
              <p className="flashcard-ipa">
                {currentCard.partOfSpeech && (
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600, marginRight: 6 }}>
                    ({currentCard.partOfSpeech})
                  </span>
                )}
                {currentCard.ipa || ''}
              </p>

              {/* Hint text */}
              <p className="flashcard-hint">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>touch_app</span>
                Tap card to reveal definition
              </p>
            </div>

            {/* ═══ BACK ═══ - tap card to flip back to front */}
            <div className="flashcard-face flashcard-face--back">

              {/* Back header: badge + word + voice + flip back */}
              <div className="flashcard-back-header">
                <div className="flashcard-back-word-row">
                  <span className={`flashcard-mastery-badge flashcard-mastery-badge--${currentCard.masteryLevel}`}
                    style={{ position: 'static', marginRight: 'var(--spacing-sm)' }}>
                    {getMasteryLabel(currentCard.masteryLevel)}
                  </span>
                  <span className="flashcard-back-word">{currentCard.word}</span>
                  <button
                    className="flashcard-voice-btn"
                    onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                    title="Pronounce word"
                    style={{ width: 28, height: 28, flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>
                      volume_up
                    </span>
                  </button>
                </div>
              </div>

              {currentCard.ipa && (
                <p className="flashcard-back-ipa" style={{ marginBottom: 12 }}>
                  {currentCard.partOfSpeech && (
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600, marginRight: 6 }}>
                      ({currentCard.partOfSpeech})
                    </span>
                  )}
                  {currentCard.ipa}
                </p>
              )}

              {/* Back content */}
              <div className="flashcard-back-content">
                {/* Definition */}
                {currentCard.definition && (
                  <div className="flashcard-back-section">
                    <span className="flashcard-back-label">Definition</span>
                    <p className="flashcard-back-definition">{currentCard.definition}</p>
                  </div>
                )}

                {/* Example sentence */}
                {currentCard.exampleSentence && (
                  <div className="flashcard-back-section">
                    <span className="flashcard-back-label">Example</span>
                    <p className="flashcard-back-example">"{currentCard.exampleSentence}"</p>
                  </div>
                )}

                {/* Synonyms */}
                {currentCard.synonyms?.length > 0 && (
                  <div className="flashcard-back-section">
                    <span className="flashcard-back-label">Synonyms</span>
                    <div className="flashcard-back-tags">
                      {currentCard.synonyms.map(s => (
                        <span key={s} className="flashcard-back-tag flashcard-back-tag--syn">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Antonyms */}
                {currentCard.antonyms?.length > 0 && (
                  <div className="flashcard-back-section">
                    <span className="flashcard-back-label">Antonyms</span>
                    <div className="flashcard-back-tags">
                      {currentCard.antonyms.map(a => (
                        <span key={a} className="flashcard-back-tag flashcard-back-tag--ant">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>{/* end flashcard-scene */}

        {/* ── Action Buttons (only show when flipped) ── */}
        {isFlipped ? (
          <div className="flashcard-actions">
            <button className="flashcard-action-btn flashcard-action-btn--again" onClick={() => handleRate(1)}>
              <span className="material-symbols-outlined">replay</span>
              Again
            </button>
            <button className="flashcard-action-btn flashcard-action-btn--hard" onClick={() => handleRate(2)}>
              <span className="material-symbols-outlined">sentiment_dissatisfied</span>
              Hard
            </button>
            <button className="flashcard-action-btn flashcard-action-btn--good" onClick={() => handleRate(3)}>
              <span className="material-symbols-outlined">sentiment_satisfied</span>
              Good
            </button>
            <button className="flashcard-action-btn flashcard-action-btn--easy" onClick={() => handleRate(4)}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Easy
            </button>
          </div>
        ) : (
          <p className="flashcard-tap-hint">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
            Tap the card to reveal, then rate your knowledge
          </p>
        )}

        {/* ── Navigation ── */}
        <div className="flashcard-nav">
          <button
            className="flashcard-nav-btn"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
            Previous
          </button>
          <button className="flashcard-nav-btn" onClick={handleSkip}>
            Skip
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
        </div>
      </main>
    </div>
  )
}
