import { useState, useEffect } from 'react'
import { playEnglishAudio, stopAudioPlayback } from '../../utils/speechAudio.js'
import './WordLesson.css'

export default function WordLesson({
  words = [],
  onComplete,
  onBack
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playingAudioType, setPlayingAudioType] = useState(null) // 'word' | 'example' | null

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback()
    }
  }, [])

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
  const partOfSpeech = currentWord.partOfSpeech ? currentWord.partOfSpeech.toUpperCase() : ''
  const level = currentWord.level ? currentWord.level.toUpperCase() : ''

  // Definition text extraction with multi-field fallback
  const definition = currentWord.meaningVi ||
                     currentWord.vietnameseMeaning ||
                     currentWord.definitionVi ||
                     currentWord.definition ||
                     currentWord.meaning ||
                     'No definition available.'

  // Extract collocations
  const collocations = (currentWord.collocations || [])
    .map(col => typeof col === 'string' ? col : col?.phrase)
    .filter(Boolean)

  // Example sentence & translation
  const exampleSentence = currentWord.exampleSentence ||
                         (Array.isArray(currentWord.exampleSentences) ? currentWord.exampleSentences[0] : '') ||
                         ''
  const exampleTranslation = currentWord.exampleTranslation ||
                            currentWord.exampleVietnamese ||
                            ''

  const handlePlayAudio = (text, type) => {
    if (!text) return
    setPlayingAudioType(type)
    playEnglishAudio(text, {
      onStart: () => setPlayingAudioType(type),
      onEnd: () => setPlayingAudioType(null),
      onError: () => setPlayingAudioType(null)
    })
  }

  const selectWord = (index) => {
    stopAudioPlayback()
    setPlayingAudioType(null)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    stopAudioPlayback()
    setPlayingAudioType(null)
    if (isLastWord) {
      onComplete?.()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      stopAudioPlayback()
      setPlayingAudioType(null)
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

      {/* Main Flashcard Card (Direct layout without 3D flipping) */}
      <div className="word-lesson__card card-base">
        {/* Top Header Row: Word Title + Speaker Icon */}
        <div className="word-lesson__header">
          <div className="word-lesson__header-main">
            <h2 className="word-lesson__word">{currentWord.word}</h2>
            <div className="word-lesson__meta-badges">
              {ipa && (
                <span className="word-lesson__badge word-lesson__badge--ipa">
                  {ipa}
                </span>
              )}
              {partOfSpeech && (
                <span className="word-lesson__badge word-lesson__badge--pos">
                  {partOfSpeech}
                </span>
              )}
              {level && (
                <span className="word-lesson__badge word-lesson__badge--level">
                  {level}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`word-lesson__audio-btn ${playingAudioType === 'word' ? 'word-lesson__audio-btn--playing' : ''}`}
            onClick={() => handlePlayAudio(currentWord.word, 'word')}
            title="Listen to pronunciation"
            aria-label={`Listen to ${currentWord.word}`}
          >
            <span className="material-symbols-outlined">
              {playingAudioType === 'word' ? 'volume_up' : 'volume_up'}
            </span>
          </button>
        </div>

        <div className="word-lesson__divider" />

        {/* Section 1: Meaning & Definition */}
        <div className="word-lesson__section">
          <div className="word-lesson__section-heading">
            <span className="material-symbols-outlined word-lesson__heading-icon">translate</span>
            <span className="word-lesson__heading-label">Meaning & Definition</span>
          </div>
          <p className="word-lesson__meaning">
            {definition}
          </p>
        </div>

        {/* Section 2: Common Collocations */}
        {collocations.length > 0 && (
          <div className="word-lesson__section">
            <div className="word-lesson__section-heading">
              <span className="material-symbols-outlined word-lesson__heading-icon">link</span>
              <span className="word-lesson__heading-label">Common Collocations</span>
            </div>
            <div className="word-lesson__collocations">
              {collocations.map((col, idx) => (
                <div key={idx} className="word-lesson__collocation-pill">
                  <span className="word-lesson__collocation-sparkle">✨</span>
                  <span className="word-lesson__collocation-text">{col}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Example in Context */}
        {exampleSentence && (
          <div className="word-lesson__section">
            <div className="word-lesson__section-heading">
              <span className="material-symbols-outlined word-lesson__heading-icon">format_quote</span>
              <span className="word-lesson__heading-label">Example in Context</span>
            </div>
            <div className="word-lesson__example-callout">
              <p className="word-lesson__example-sentence">
                "{exampleSentence}"
              </p>
              {exampleTranslation && (
                <p className="word-lesson__example-translation">
                  → {exampleTranslation}
                </p>
              )}
              <button
                type="button"
                className={`word-lesson__example-audio-btn ${playingAudioType === 'example' ? 'word-lesson__example-audio-btn--playing' : ''}`}
                onClick={() => handlePlayAudio(exampleSentence, 'example')}
                title="Listen to example sentence"
              >
                <span className="material-symbols-outlined">volume_up</span>
                <span>Listen to example</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation actions */}
      <div className="word-lesson__actions">
        <button
          type="button"
          className="btn-secondary word-lesson__btn-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Previous Word
        </button>

        <button
          type="button"
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
