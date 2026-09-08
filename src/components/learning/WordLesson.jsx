import { useState } from 'react'
import './WordLesson.css'

export default function WordLesson({ words = [], onComplete, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  if (!words || words.length === 0) {
    return (
      <div className="word-lesson__empty card-base">
        <span className="material-symbols-outlined">menu_book</span>
        <p>Không có từ vựng nào trong bài học này.</p>
        <button className="btn-primary" onClick={onBack}>Quay lại</button>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const isLastWord = currentIndex === words.length - 1

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
    if (isLastWord) {
      onComplete?.()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
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
              onClick={() => setCurrentIndex(idx)}
              title={w.word}
            >
              <span>{idx + 1}</span>
            </button>
          ))}
        </div>
        <span className="word-lesson__counter text-label-md">
          Từ {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Main Flash/Lesson Card */}
      <div className="word-lesson__card card-base">
        <div className="word-lesson__top">
          <div className="word-lesson__title-row">
            <h2 className="word-lesson__word">{currentWord.word}</h2>
            <button
              className={`word-lesson__audio-btn ${isPlayingAudio ? 'word-lesson__audio-btn--playing' : ''}`}
              onClick={() => handlePlayAudio(currentWord.word)}
              title="Nghe phát âm"
              aria-label="Phát âm"
            >
              <span className="material-symbols-outlined">
                {isPlayingAudio ? 'volume_up' : 'volume_down'}
              </span>
            </button>
          </div>

          <div className="word-lesson__meta">
            {currentWord.ipa && <span className="word-lesson__ipa">{currentWord.ipa}</span>}
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

        {/* Vietnamese Meaning */}
        <div className="word-lesson__section">
          <h4 className="word-lesson__section-title">
            <span className="material-symbols-outlined">translate</span>
            Ý nghĩa tiếng Việt
          </h4>
          <p className="word-lesson__meaning">{currentWord.meaningVi || currentWord.vietnameseMeaning || currentWord.meaning}</p>
        </div>

        {/* Collocations */}
        {currentWord.collocations && currentWord.collocations.length > 0 && (
          <div className="word-lesson__section">
            <h4 className="word-lesson__section-title">
              <span className="material-symbols-outlined">link</span>
              Cụm từ thường đi cùng (Collocations)
            </h4>
            <div className="word-lesson__collocations">
              {currentWord.collocations.map((col, idx) => (
                <div key={idx} className="word-lesson__collocation-chip">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="word-lesson__collocation-text">{typeof col === 'string' ? col : col.phrase}</span>
                  {col.meaning && <span className="word-lesson__collocation-sub">({col.meaning})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example in Context */}
        {currentWord.exampleSentence && (
          <div className="word-lesson__section word-lesson__section--example">
            <h4 className="word-lesson__section-title">
              <span className="material-symbols-outlined">format_quote</span>
              Ví dụ trong ngữ cảnh thực tế
            </h4>
            <div className="word-lesson__example-box">
              <p className="word-lesson__example-en">"{currentWord.exampleSentence}"</p>
              {currentWord.exampleTranslation && (
                <p className="word-lesson__example-vi">→ {currentWord.exampleTranslation}</p>
              )}
              <button
                className="word-lesson__example-audio-btn"
                onClick={() => handlePlayAudio(currentWord.exampleSentence)}
                title="Nghe câu ví dụ"
              >
                <span className="material-symbols-outlined">volume_up</span> Nghe câu ví dụ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation actions */}
      <div className="word-lesson__actions">
        <button
          className="btn-secondary word-lesson__btn-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Từ trước
        </button>

        <button
          className="btn-primary word-lesson__btn-next"
          onClick={handleNext}
        >
          {isLastWord ? (
            <>
              Luyện tập nhanh ngay
              <span className="material-symbols-outlined">bolt</span>
            </>
          ) : (
            <>
              Từ tiếp theo
              <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
