import { useState, useMemo } from 'react'
import './PracticeStep.css'

export default function PracticeStep({ words = [], onComplete, onBack }) {
  // Generate interactive practice questions for all words
  const questions = useMemo(() => {
    if (!words || words.length === 0) return []

    const list = []
    words.forEach((w, idx) => {
      // 1. Multiple choice question
      const wrongOptions = words
        .filter((_, i) => i !== idx)
        .map(other => other.meaningVi || other.vietnameseMeaning || other.meaning)

      const fallbackWrongs = ['Freedom and autonomy', 'Leadership capability', 'Novel experience', 'Growth and expansion']
      const options = [
        w.meaningVi || w.vietnameseMeaning || w.meaning,
        wrongOptions[0] || fallbackWrongs[0],
        wrongOptions[1] || fallbackWrongs[1],
        fallbackWrongs[2]
      ].sort(() => Math.random() - 0.5)

      list.push({
        id: `mc_${w.word}_${idx}`,
        word: w.word,
        type: 'multiple_choice',
        title: `What is the accurate meaning of "${w.word}"?`,
        sentence: w.exampleSentence ? `Example: "${w.exampleSentence}"` : '',
        options: options,
        correctAnswer: w.meaningVi || w.vietnameseMeaning || w.meaning,
        explanation: `${w.word} (${w.partOfSpeech || 'word'}): ${w.meaningVi || w.meaning}`
      })

      // 2. Fill in the blank question
      if (w.exampleSentence) {
        const regex = new RegExp(`\\b${w.word}\\b`, 'gi')
        const maskedSentence = w.exampleSentence.replace(regex, '_______')
        const distractors = words.filter((_, i) => i !== idx).map(item => item.word)
        const wordOptions = [w.word, ...distractors, 'improve', 'challenge'].slice(0, 4).sort(() => Math.random() - 0.5)

        list.push({
          id: `fib_${w.word}_${idx}`,
          word: w.word,
          type: 'fill_in_blank',
          title: 'Choose the correct word for the blank:',
          sentence: maskedSentence,
          translation: w.exampleTranslation,
          options: wordOptions,
          correctAnswer: w.word,
          explanation: `Complete sentence: "${w.exampleSentence}"`
        })
      }
    })

    return list
  }, [words])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)

  if (questions.length === 0) {
    return (
      <div className="practice-step__empty card-base">
        <p>No practice questions available.</p>
        <button className="btn-primary" onClick={onComplete}>Continue</button>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const isCorrect = isAnswered && selectedAnswer?.toLowerCase() === currentQ.correctAnswer.toLowerCase()

  const handleSelectOption = (option) => {
    if (isAnswered) return
    setSelectedAnswer(option)
    setIsAnswered(true)

    const correct = option.toLowerCase() === currentQ.correctAnswer.toLowerCase()
    if (correct) {
      setCorrectCount(prev => prev + 1)
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      onComplete?.({
        total: questions.length,
        // correctCount already includes the current question: handleSelectOption
        // increments it on answer, so adding isCorrect here double-counts.
        correct: correctCount
      })
    }
  }

  return (
    <div className="practice-step animate-fade-in">
      {/* Top progress and streak */}
      <div className="practice-step__header">
        <div className="practice-step__progress-bar">
          <div
            className="practice-step__progress-fill"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="practice-step__meta-row">
          <span className="text-label-md practice-step__counter">
            Question {currentIndex + 1} / {questions.length}
          </span>
          {streak > 1 && (
            <div className="practice-step__streak-badge">
              <span className="material-symbols-outlined">local_fire_department</span>
              <span>Streak x{streak}!</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div className="practice-step__card card-base">
        <div className="practice-step__type-badge">
          <span className="material-symbols-outlined">
            {currentQ.type === 'multiple_choice' ? 'quiz' : 'edit_note'}
          </span>
          <span>{currentQ.type === 'multiple_choice' ? 'Vocabulary Quiz' : 'Contextual Fill-in-the-Blank'}</span>
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
            if (isAnswered) {
              if (opt.toLowerCase() === currentQ.correctAnswer.toLowerCase()) {
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
                {isAnswered && opt.toLowerCase() === currentQ.correctAnswer.toLowerCase() && (
                  <span className="material-symbols-outlined practice-step__option-icon">check_circle</span>
                )}
                {isAnswered && opt === selectedAnswer && opt.toLowerCase() !== currentQ.correctAnswer.toLowerCase() && (
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
                  {isCorrect ? 'Correct!' : 'Incorrect!'}
                </p>
                <p className="practice-step__feedback-exp">{currentQ.explanation}</p>
              </div>
            </div>

            <button className="btn-primary practice-step__btn-continue" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Proceed to Smart Writing'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>

      <div className="practice-step__footer">
        <button className="btn-secondary" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
          Review Vocabulary
        </button>
      </div>
    </div>
  )
}
