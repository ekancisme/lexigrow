import { useState, useEffect, useRef } from 'react'
import './WordLesson.css'

export default function WordLesson({ words = [], onComplete, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
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

  const stopAudio = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsPlayingAudio(false)
  }

  const selectWord = (index) => {
    stopAudio()
    setIsFlipped(false)
    setCurrentIndex(index)
  }

  const handlePlayAudio = (text) => {
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

      {/* Main Flash/Lesson Card */}
      <div className="word-lesson__card">
        <div className={`word-lesson__card-inner ${isFlipped ? 'word-lesson__card-inner--flipped' : ''}`}>
          <section
            className="word-lesson__face word-lesson__face--front card-base"
            aria-hidden={isFlipped}
            inert={isFlipped}
          >
            <div className="word-lesson__top">
              <div className="word-lesson__title-row">
                <h2 className="word-lesson__word">{currentWord.word}</h2>
                <button
                  type="button"
                  className={`word-lesson__audio-btn ${isPlayingAudio ? 'word-lesson__audio-btn--playing' : ''}`}
                  onClick={() => handlePlayAudio(currentWord.word)}
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
              </div>
            </div>

            <p className="word-lesson__front-hint">Think of the meaning and an example before you flip.</p>
            <button ref={frontFlipButtonRef} type="button" className="word-lesson__flip-btn" onClick={() => setIsFlipped(true)}>
              <span>Show meaning & usage</span>
              <span className="material-symbols-outlined" aria-hidden="true">flip_to_back</span>
            </button>
          </section>

          <section
            className="word-lesson__face word-lesson__face--back card-base"
            aria-hidden={!isFlipped}
            inert={!isFlipped}
          >
            <div className="word-lesson__back-heading">
              <div>
                <p className="word-lesson__back-eyebrow">Meaning & usage</p>
                <h3 className="word-lesson__back-word">{currentWord.word}</h3>
              </div>
              <button ref={backFlipButtonRef} type="button" className="word-lesson__flip-btn word-lesson__flip-btn--back" onClick={() => setIsFlipped(false)}>
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
                    className="word-lesson__example-audio-btn"
                    onClick={() => handlePlayAudio(exampleSentence)}
                    title="Listen to example sentence"
                    aria-label="Listen to example sentence"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">volume_up</span>
                    Listen to example
                  </button>
                </div>
              </div>
            )}
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
