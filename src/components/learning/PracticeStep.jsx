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

      const fallbackWrongs = ['Sự tự do', 'Khả năng lãnh đạo', 'Trải nghiệm mới', 'Sự phát triển']
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
        title: `Nghĩa chính xác của từ "${w.word}" là gì?`,
        sentence: w.exampleSentence ? `Ví dụ: "${w.exampleSentence}"` : '',
        options: options,
        correctAnswer: w.meaningVi || w.vietnameseMeaning || w.meaning,
        explanation: `${w.word} (${w.partOfSpeech || 'từ'}): ${w.meaningVi || w.meaning}`
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
          title: 'Điền từ thích hợp vào chỗ trống:',
          sentence: maskedSentence,
          translation: w.exampleTranslation,
          options: wordOptions,
          correctAnswer: w.word,
          explanation: `Câu hoàn chỉnh: "${w.exampleSentence}"`
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
        <p>Không có câu hỏi luyện tập.</p>
        <button className="btn-primary" onClick={onComplete}>Tiếp tục</button>
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
        correct: correctCount + (isCorrect ? 1 : 0)
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
            Câu {currentIndex + 1} / {questions.length}
          </span>
          {streak > 1 && (
            <div className="practice-step__streak-badge">
              <span className="material-symbols-outlined">local_fire_department</span>
              <span>Chuỗi đúng x{streak}!</span>
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
          <span>{currentQ.type === 'multiple_choice' ? 'Trắc nghiệm nghĩa từ' : 'Điền từ vào ngữ cảnh'}</span>
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
                  {isCorrect ? 'Chính xác!' : 'Chưa đúng rồi!'}
                </p>
                <p className="practice-step__feedback-exp">{currentQ.explanation}</p>
              </div>
            </div>

            <button className="btn-primary practice-step__btn-continue" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Chuyển sang Luyện viết'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>

      <div className="practice-step__footer">
        <button className="btn-secondary" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
          Xem lại từ vựng
        </button>
      </div>
    </div>
  )
}
