import { useState, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './PracticeStep.css'

const safeLower = (val) => String(val ?? '').trim().toLowerCase()

const getWordMeaning = (w) =>
  w?.meaningVi ||
  w?.vietnameseMeaning ||
  w?.definitionVi ||
  w?.definition ||
  w?.meaning ||
  w?.word ||
  ''

export default function PracticeStep({ words = [], onComplete, onBack }) {
  const { t } = useLanguage()

  // Generate interactive practice questions for all words
  const questions = useMemo(() => {
    if (!words || words.length === 0) return []

    const list = []
    words.forEach((w, idx) => {
      if (!w || !w.word) return
      const correctMeaning = getWordMeaning(w)
      // 1. Multiple choice question
      const wrongOptions = words
        .filter((_, i) => i !== idx)
        .map(other => getWordMeaning(other))
        .filter(Boolean)

      const fallbackWrongs = ['Freedom and autonomy', 'Leadership capability', 'Novel experience', 'Growth and expansion']
      const options = [
        correctMeaning,
        wrongOptions[0] || fallbackWrongs[0],
        wrongOptions[1] || fallbackWrongs[1],
        wrongOptions[2] || fallbackWrongs[2]
      ].filter(Boolean).sort(() => Math.random() - 0.5)

      list.push({
        id: `mc_${w.word}_${idx}`,
        word: w.word,
        type: 'multiple_choice',
        title: t('learning.practiceTitleMC', `What is the accurate meaning of "${w.word}"?`, { word: w.word }),
        sentence: w.exampleSentence ? `"${w.exampleSentence}"` : '',
        options: options,
        correctAnswer: correctMeaning,
        explanation: `${w.word} (${w.partOfSpeech || 'word'}): ${correctMeaning}`
      })

      // 2. Fill in the blank question
      if (w.exampleSentence) {
        const regex = new RegExp(`\\b${w.word}\\b`, 'gi')
        const maskedSentence = w.exampleSentence.replace(regex, '_______')
        const distractors = words.filter((_, i) => i !== idx).map(item => item.word).filter(Boolean)
        const wordOptions = [w.word, ...distractors, 'improve', 'challenge'].slice(0, 4).sort(() => Math.random() - 0.5)

        list.push({
          id: `fib_${w.word}_${idx}`,
          word: w.word,
          type: 'fill_in_blank',
          title: t('learning.practiceTitleFIB', 'Choose the correct word for the blank:'),
          sentence: maskedSentence,
          translation: w.exampleTranslation,
          options: wordOptions,
          correctAnswer: w.word,
          explanation: `${w.word}: "${w.exampleSentence}"`
        })
      }
    })

    return list
  }, [words, t])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)

  if (questions.length === 0) {
    return (
      <div className="practice-step__empty card-base">
        <p>{t('learning.noWordsFound', 'No practice questions available for this lesson.')}</p>
        <button className="btn-primary" onClick={onComplete}>
          {t('learning.proceedWriting', 'Proceed to Smart Writing')}
        </button>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const isCorrect = isAnswered && safeLower(selectedAnswer) === safeLower(currentQ?.correctAnswer)

  const handleSelectOption = (opt) => {
    if (isAnswered) return
    setSelectedAnswer(opt)
    setIsAnswered(true)

    if (safeLower(opt) === safeLower(currentQ.correctAnswer)) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    setSelectedAnswer(null)
    setIsAnswered(false)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onComplete?.({
        score: score + (isCorrect ? 1 : 0),
        total: questions.length
      })
    }
  }

  return (
    <div className="practice-step animate-fade-in">
      {/* Progress header bar */}
      <div className="practice-step__nav">
        <div className="practice-step__progress-info">
          <span className="practice-step__badge">
            <span className="material-symbols-outlined">quiz</span>
            <span>
              {currentQ.type === 'multiple_choice' ? t('common.multipleChoice', 'Multiple Choice') : t('common.fillBlank', 'Fill in Blank')}
            </span>
          </span>
          <span className="practice-step__counter text-label-md">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="practice-step__bar">
          <div
            className="practice-step__bar-fill"
            style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main interactive practice card */}
      <div className="practice-step__card card-base">
        <div className="practice-step__card-header">
          <span className="practice-step__target-word-pill">
            <span className="material-symbols-outlined">school</span>
            <span>{currentQ.word}</span>
          </span>
        </div>

        <h3 className="practice-step__title">{currentQ.title}</h3>

        {currentQ.sentence && (
          <div className="practice-step__sentence-box">
            <p className="practice-step__sentence-text">{currentQ.sentence}</p>
            {currentQ.translation && (
              <p className="practice-step__sentence-sub">→ {currentQ.translation}</p>
            )}
          </div>
        )}

        {/* Options grid */}
        <div className="practice-step__options">
          {currentQ.options.map((opt, idx) => {
            let optionClass = 'practice-step__option-btn'
            const isMatchCorrect = safeLower(opt) === safeLower(currentQ?.correctAnswer)
            if (isAnswered) {
              if (isMatchCorrect) {
                optionClass += ' practice-step__option-btn--correct'
              } else if (opt === selectedAnswer) {
                optionClass += ' practice-step__option-btn--wrong'
              } else {
                optionClass += ' practice-step__option-btn--disabled'
              }
            }

            return (
              <button
                key={idx}
                className={optionClass}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswered}
              >
                <span className="practice-step__option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="practice-step__option-text">{opt}</span>
                {isAnswered && isMatchCorrect && (
                  <span className="material-symbols-outlined practice-step__option-icon">check_circle</span>
                )}
                {isAnswered && opt === selectedAnswer && !isMatchCorrect && (
                  <span className="material-symbols-outlined practice-step__option-icon">cancel</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Instant explanation feedback bar */}
        {isAnswered && (
          <div className={`practice-step__feedback-box ${isCorrect ? 'practice-step__feedback-box--correct' : 'practice-step__feedback-box--wrong'} animate-fade-in`}>
            <div className="practice-step__feedback-content">
              <span className="material-symbols-outlined practice-step__feedback-icon">
                {isCorrect ? 'sentiment_very_satisfied' : 'info'}
              </span>
              <div>
                <p className="practice-step__feedback-status">
                  {isCorrect ? t('learning.correct', 'Correct!') : t('learning.incorrect', 'Incorrect!')}
                </p>
                <p className="practice-step__feedback-exp">{currentQ.explanation}</p>
              </div>
            </div>

            <button className="btn-primary practice-step__btn-continue" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? t('learning.nextQuestion', 'Next Question') : t('learning.proceedWriting', 'Proceed to Smart Writing')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>

      <div className="practice-step__footer">
        <button className="btn-secondary" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
          {t('learning.reviewVocabulary', 'Review Vocabulary')}
        </button>
      </div>
    </div>
  )
}
