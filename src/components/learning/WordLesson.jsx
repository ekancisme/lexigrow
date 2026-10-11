import { useState, useEffect, useRef } from 'react'
import './WordLesson.css'

const TOPIC_VISUALS = {
  'travel': {
    title: 'Travel & Exploration',
    icon: 'flight_takeoff',
    accentColor: '#0d9488',
    gradient: 'linear-gradient(135deg, rgba(13, 148, 136, 0.35) 0%, rgba(20, 184, 166, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    alt: 'Travel and exploration itinerary'
  },
  'daily-life': {
    title: 'Daily Life & Routines',
    icon: 'wb_sunny',
    accentColor: '#005bbf',
    gradient: 'linear-gradient(135deg, rgba(0, 91, 191, 0.35) 0%, rgba(26, 115, 232, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    alt: 'Daily routine and productivity'
  },
  'technology': {
    title: 'Technology & Digital Era',
    icon: 'smart_toy',
    accentColor: '#0284c7',
    gradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(56, 189, 248, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    alt: 'Technology and innovation'
  },
  'environment': {
    title: 'Environment & Sustainability',
    icon: 'eco',
    accentColor: '#16a34a',
    gradient: 'linear-gradient(135deg, rgba(22, 163, 74, 0.35) 0%, rgba(34, 197, 94, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    alt: 'Nature and sustainable environment'
  },
  'hobbies': {
    title: 'Hobbies & Creative Arts',
    icon: 'palette',
    accentColor: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(139, 92, 246, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    alt: 'Hobbies and creative arts'
  },
  'business': {
    title: 'Business & Career',
    icon: 'business_center',
    accentColor: '#ea580c',
    gradient: 'linear-gradient(135deg, rgba(234, 88, 12, 0.35) 0%, rgba(249, 115, 22, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    alt: 'Business and career development'
  },
  'academic': {
    title: 'Academic & Science',
    icon: 'school',
    accentColor: '#4f46e5',
    gradient: 'linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(99, 102, 241, 0.15) 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    alt: 'Academic study and research'
  }
}

const DEFAULT_VISUAL = {
  title: 'Vocabulary Lesson',
  icon: 'auto_stories',
  accentColor: '#005bbf',
  gradient: 'linear-gradient(135deg, rgba(0, 91, 191, 0.35) 0%, rgba(79, 131, 255, 0.15) 100%)',
  imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  alt: 'LexiGrow Vocabulary'
}

function renderHighlightedSentence(sentence, targetWord) {
  if (!sentence) return null
  if (!targetWord) return sentence
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(\\b${escaped}(?:s|ed|ing)?\\b)`, 'gi')
  const parts = sentence.split(regex)
  return parts.map((part, i) => {
    if (part.toLowerCase().startsWith(targetWord.toLowerCase())) {
      return (
        <strong key={i} className="word-lesson__context-highlight">
          {part}
        </strong>
      )
    }
    return part
  })
}

export default function WordLesson({
  words = [],
  topicSlug = '',
  topicTitle = '',
  onComplete,
  onBack
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [failedImages, setFailedImages] = useState(() => new Set())
  const frontFlipButtonRef = useRef(null)
  const backFlipButtonRef = useRef(null)
  const previousFlipStateRef = useRef(isFlipped)

  // Cancel any in-flight speech when the lesson unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (previousFlipStateRef.current !== isFlipped) {
      previousFlipStateRef.current = isFlipped
      const focusTarget = isFlipped ? backFlipButtonRef.current : frontFlipButtonRef.current
      focusTarget?.focus({ preventScroll: true })
    }
  }, [isFlipped])

  if (!words || words.length === 0) {
    return (
      <div className="word-lesson__empty card-base">
        <span className="material-symbols-outlined">menu_book</span>
        <p>No vocabulary items found in this lesson.</p>
        <button className="btn-primary" onClick={onBack}>Go back</button>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const isLastWord = currentIndex === words.length - 1
  const ipa = currentWord.ipa || currentWord.phonetic || ''
  const exampleSentence = currentWord.exampleSentence || currentWord.exampleSentences?.[0] || ''

  // Resolve visual metadata for current topic
  const resolvedSlug = topicSlug || currentWord.topicSlug || currentWord.category || currentWord.theme || ''
  const visual = TOPIC_VISUALS[resolvedSlug] || DEFAULT_VISUAL
  const visualImageSrc = currentWord.imageUrl || currentWord.image || visual.imageUrl
  const isImageFailed = failedImages.has(currentWord.word)

  // Extract sample collocations
  const sampleCollocations = (currentWord.collocations || [])
    .map(col => typeof col === 'string' ? col : col?.phrase)
    .filter(Boolean)

  const posLabel = {
    noun: 'Danh từ (Noun) — chỉ người, sự vật hoặc khái niệm',
    verb: 'Động từ (Verb) — chỉ hành động hoặc quá trình',
    adjective: 'Tính từ (Adjective) — miêu tả đặc điểm, tính chất',
    adverb: 'Trạng từ (Adverb) — bổ nghĩa hành động hoặc mức độ',
  }[currentWord.partOfSpeech?.toLowerCase()] || (currentWord.partOfSpeech ? `Từ loại: ${currentWord.partOfSpeech}` : '')

  const stopAudio = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsPlayingAudio(false)
  }

  const selectWord = (index) => {
    stopAudio()
    setIsFlipped(false)
    setCurrentIndex(index)
  }

  const handlePlayAudio = (text, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true)
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.onend = () => setIsPlayingAudio(false)
      utterance.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleFrontClick = (e) => {
    // If clicked on audio button or interactive elements, ignore
    if (e.target.closest('.word-lesson__audio-btn, .word-lesson__example-audio-btn, [data-no-flip="true"]')) {
      return
    }
    // If user is selecting text to copy, ignore
    const selection = window.getSelection()?.toString()
    if (selection && selection.trim().length > 0) {
      return
    }
    setIsFlipped(true)
  }

  const handleBackClick = (e) => {
    if (e.target.closest('.word-lesson__audio-btn, .word-lesson__example-audio-btn, [data-no-flip="true"]')) {
      return
    }
    const selection = window.getSelection()?.toString()
    if (selection && selection.trim().length > 0) {
      return
    }
    setIsFlipped(false)
  }

  const handleCardKeyDown = (e) => {
    if (e.target.closest('button, a, input')) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setIsFlipped(prev => !prev)
    }
  }

  const handleNext = () => {
    stopAudio()
    setIsFlipped(false)
    if (isLastWord) {
      onComplete?.()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      stopAudio()
      setIsFlipped(false)
      setCurrentIndex(prev => prev - 1)
    }
  }

  return (
    <div className="word-lesson animate-fade-in">
      {/* Header step tracker */}
      <div className="word-lesson__nav">
        <div className="word-lesson__steps">
          {words.map((w, idx) => (
            <button
              key={w._id || w.word || idx}
              className={`word-lesson__step-dot ${idx === currentIndex ? 'word-lesson__step-dot--active' : ''} ${idx < currentIndex ? 'word-lesson__step-dot--done' : ''}`}
              onClick={() => selectWord(idx)}
              aria-label={`Show word ${idx + 1}: ${w.word}`}
              aria-current={idx === currentIndex ? 'step' : undefined}
              title={w.word}
            >
              <span>{idx + 1}</span>
            </button>
          ))}
        </div>
        <span className="word-lesson__counter text-label-md">
          Word {currentIndex + 1} of {words.length}
        </span>
      </div>

      {/* Main Flash/Lesson Card - Clickable container */}
      <div
        className="word-lesson__card"
        tabIndex={0}
        role="button"
        aria-label={`Vocabulary card for ${currentWord.word}. Press space or enter to flip.`}
        onKeyDown={handleCardKeyDown}
      >
        <div className={`word-lesson__card-inner ${isFlipped ? 'word-lesson__card-inner--flipped' : ''}`}>
          {/* FRONT FACE - Click anywhere to flip */}
          <section
            className="word-lesson__face word-lesson__face--front card-base"
            aria-hidden={isFlipped}
            inert={isFlipped}
            onClick={handleFrontClick}
          >
            {/* Top Row: Word & Audio button */}
            <div className="word-lesson__top">
              <div className="word-lesson__title-row">
                <h2 className="word-lesson__word">{currentWord.word}</h2>
                <button
                  type="button"
                  data-no-flip="true"
                  className={`word-lesson__audio-btn ${isPlayingAudio ? 'word-lesson__audio-btn--playing' : ''}`}
                  onClick={(e) => handlePlayAudio(currentWord.word, e)}
                  title="Listen to pronunciation"
                  aria-label={`Listen to ${currentWord.word}`}
                >
                  <span className="material-symbols-outlined">
                    {isPlayingAudio ? 'volume_up' : 'volume_down'}
                  </span>
                </button>
              </div>

              <div className="word-lesson__meta">
                {ipa && <span className="word-lesson__ipa">{ipa}</span>}
                {currentWord.partOfSpeech && (
                  <span className="word-lesson__badge word-lesson__badge--pos">
                    {currentWord.partOfSpeech}
                  </span>
                )}
                {currentWord.level && (
                  <span className="word-lesson__badge word-lesson__badge--level">
                    {currentWord.level.toUpperCase()}
                  </span>
                )}
                <span className="word-lesson__badge word-lesson__badge--topic">
                  <span className="material-symbols-outlined">{visual.icon}</span>
                  <span>{topicTitle || visual.title}</span>
                </span>
              </div>
            </div>

            {/* Interactive Body Area - What the user circled */}
            <div className="word-lesson__body-interactive">
              {/* Visual illustration banner */}
              <div className="word-lesson__visual-banner" style={{ background: visual.gradient }}>
                {!isImageFailed && visualImageSrc ? (
                  <img
                    src={visualImageSrc}
                    alt={visual.alt || currentWord.word}
                    className="word-lesson__visual-img"
                    loading="lazy"
                    onError={() => {
                      setFailedImages(prev => {
                        const next = new Set(prev)
                        next.add(currentWord.word)
                        return next
                      })
                    }}
                  />
                ) : (
                  <div className="word-lesson__visual-fallback">
                    <span className="material-symbols-outlined word-lesson__visual-fallback-icon">
                      {visual.icon}
                    </span>
                  </div>
                )}
                <div className="word-lesson__visual-overlay">
                  <span className="word-lesson__visual-tag">
                    <span className="material-symbols-outlined">{visual.icon}</span>
                    <span>{topicTitle || visual.title}</span>
                  </span>
                </div>
              </div>

              {/* Sample Collocations / Từ mẫu gợi ý */}
              {sampleCollocations.length > 0 && (
                <div className="word-lesson__sample-section">
                  <div className="word-lesson__front-subtitle">
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span>Cụm từ mẫu thường gặp (Sample collocations):</span>
                  </div>
                  <div className="word-lesson__sample-chips">
                    {sampleCollocations.slice(0, 4).map((phrase, idx) => (
                      <span key={`${phrase}-${idx}`} className="word-lesson__sample-chip">
                        <span className="material-symbols-outlined">label</span>
                        <span>{phrase}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Clue / Câu mẫu gợi ý trong ngữ cảnh */}
              {exampleSentence && (
                <div className="word-lesson__context-clue">
                  <div className="word-lesson__front-subtitle">
                    <span className="material-symbols-outlined">format_quote</span>
                    <span>Câu ví dụ mẫu trong ngữ cảnh:</span>
                  </div>
                  <p className="word-lesson__context-sentence">
                    “{renderHighlightedSentence(exampleSentence, currentWord.word)}”
                  </p>
                  <span className="word-lesson__context-subnote">
                    💡 Thử suy đoán nghĩa của từ trong câu trên trước khi lật thẻ.
                  </span>
                </div>
              )}

              {/* Memory hook / Vai trò từ loại */}
              {posLabel && (
                <div className="word-lesson__role-box">
                  <span className="material-symbols-outlined">info</span>
                  <span>{posLabel}</span>
                </div>
              )}

              {/* Big prominent click-to-flip callout bar */}
              <div className="word-lesson__flip-action-bar">
                <div className="word-lesson__flip-action-text">
                  <span className="material-symbols-outlined word-lesson__pulse-icon">touch_app</span>
                  <span>Chạm vào đây hoặc bất kỳ đâu trên thẻ để xem nghĩa & cách dùng</span>
                </div>
                <button
                  ref={frontFlipButtonRef}
                  type="button"
                  data-no-flip="true"
                  className="word-lesson__flip-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsFlipped(true)
                  }}
                >
                  <span>Show meaning & usage</span>
                  <span className="material-symbols-outlined" aria-hidden="true">flip_to_back</span>
                </button>
              </div>
            </div>
          </section>

          {/* BACK FACE - Click anywhere to flip back */}
          <section
            className="word-lesson__face word-lesson__face--back card-base"
            aria-hidden={!isFlipped}
            inert={!isFlipped}
            onClick={handleBackClick}
          >
            <div className="word-lesson__back-heading">
              <div>
                <p className="word-lesson__back-eyebrow">Meaning & usage</p>
                <h3 className="word-lesson__back-word">{currentWord.word}</h3>
              </div>
              <button
                ref={backFlipButtonRef}
                type="button"
                data-no-flip="true"
                className="word-lesson__flip-btn word-lesson__flip-btn--back"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFlipped(false)
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">flip_to_front</span>
                <span>Show word</span>
              </button>
            </div>

            <div className="word-lesson__section">
              <h4 className="word-lesson__section-title">
                <span className="material-symbols-outlined">translate</span>
                Meaning & definition
              </h4>
              <p className="word-lesson__meaning">
                {currentWord.meaningVi || currentWord.vietnameseMeaning || currentWord.definitionVi || currentWord.definition || currentWord.meaning || 'No definition available.'}
              </p>
            </div>

            {currentWord.collocations?.length > 0 && (
              <div className="word-lesson__section">
                <h4 className="word-lesson__section-title">
                  <span className="material-symbols-outlined">link</span>
                  Common collocations
                </h4>
                <div className="word-lesson__collocations">
                  {currentWord.collocations.map((col, idx) => {
                    const phrase = typeof col === 'string' ? col : col.phrase
                    const meaning = typeof col === 'string' ? '' : col.meaning
                    return (
                      <div key={`${phrase}-${idx}`} className="word-lesson__collocation-chip">
                        <span className="word-lesson__collocation-text">{phrase}</span>
                        {meaning && <span className="word-lesson__collocation-sub">{meaning}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {exampleSentence && (
              <div className="word-lesson__section word-lesson__section--example">
                <h4 className="word-lesson__section-title">
                  <span className="material-symbols-outlined">format_quote</span>
                  Example in context
                </h4>
                <div className="word-lesson__example-box">
                  <p className="word-lesson__example-en">“{exampleSentence}”</p>
                  {currentWord.exampleTranslation && (
                    <p className="word-lesson__example-vi">{currentWord.exampleTranslation}</p>
                  )}
                  <button
                    type="button"
                    data-no-flip="true"
                    className="word-lesson__example-audio-btn"
                    onClick={(e) => handlePlayAudio(exampleSentence, e)}
                    title="Listen to example sentence"
                    aria-label="Listen to example sentence"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">volume_up</span>
                    Listen to example
                  </button>
                </div>
              </div>
            )}

            {/* Back face flip prompt indicator */}
            <div className="word-lesson__flip-action-bar word-lesson__flip-action-bar--back">
              <div className="word-lesson__flip-action-text">
                <span className="material-symbols-outlined word-lesson__pulse-icon">touch_app</span>
                <span>Chạm vào đây hoặc bất kỳ đâu trên thẻ để quay lại mặt trước</span>
              </div>
              <span className="material-symbols-outlined" aria-hidden="true">flip_to_front</span>
            </div>
          </section>
        </div>
      </div>

      {/* Navigation actions */}
      <div className="word-lesson__actions">
        <button
          className="btn-secondary word-lesson__btn-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Previous Word
        </button>

        <button
          className="btn-primary word-lesson__btn-next"
          onClick={handleNext}
        >
          {isLastWord ? (
            <>
              Start Practice
              <span className="material-symbols-outlined">bolt</span>
            </>
          ) : (
            <>
              Next Word
              <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
