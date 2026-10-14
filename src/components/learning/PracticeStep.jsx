import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './PracticeStep.css'

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function maskSentence(sentence, targetWord, correctAnswer) {
  if (!sentence) return ''
  if (/_{3,}/.test(sentence) || /\[blank\]/i.test(sentence)) {
    return sentence.replace(/_{3,}|\[blank\]/gi, '_______')
  }
  const wordsToTry = [correctAnswer, targetWord].filter(Boolean)
  let result = sentence
  for (const w of wordsToTry) {
    const stem = w.endsWith('y') ? w.slice(0, -1) : w
    const pattern = new RegExp(`\\b(${escapeRegex(w)}|${escapeRegex(stem)}(?:ies|ied|ying)|${escapeRegex(w)}(?:s|es|ed|ing|d)?)\\b`, 'i')
    if (pattern.test(result)) {
      return result.replace(pattern, '_______')
    }
  }
  return `Please fill in the _______: "${sentence}"`
}

const safeLower = (val) => String(val ?? '').trim().toLowerCase()

const getWordMeaning = (w) =>
  w?.meaningVi ||
  w?.vietnameseMeaning ||
  w?.definitionVi ||
  w?.definition ||
  w?.meaning ||
  w?.word ||
  ''

export default function PracticeStep({
  words = [],
  questions: propQuestions = [],
  loading = false,
  refreshing = false,
  error = null,
  onRefresh,
  onComplete,
  onBack,
}) {
  const { t } = useLanguage()

  // Compute fallback local questions if AI questions haven't arrived
  const fallbackQuestions = useMemo(() => {
    if (!words || words.length === 0) return []

    const list = []
    words.forEach((w, idx) => {
      const word = w.word
      const meaning = getWordMeaning(w)
      const wrongOptions = words
        .filter((_, i) => i !== idx)
        .map(other => getWordMeaning(other))
        .filter(Boolean)

      const fallbackWrongs = ['Freedom and autonomy', 'Leadership capability', 'Novel experience', 'Growth and expansion']
      const options = [
        meaning,
        wrongOptions[0] || fallbackWrongs[0],
        wrongOptions[1] || fallbackWrongs[1],
        fallbackWrongs[2]
      ].sort(() => Math.random() - 0.5)

      const mcTitles = [
        t('learning.practiceTitleMC', `What does the word "${word}" mean in this context?`, { word }),
        `Which of the following is the best definition of "${word}"?`,
        `How is "${word}" most appropriately understood?`,
        `What is the primary meaning of "${word}" in daily communication?`,
      ]
      const mcTitle = mcTitles[idx % mcTitles.length]

      // 1. Multiple choice question
      list.push({
        id: `mc_${word}_${idx}`,
        word,
        type: 'multiple_choice',
        title: mcTitle,
        sentence: w.exampleSentence ? `Example: "${w.exampleSentence}"` : '',
        options: options,
        correctAnswer: meaning,
        explanation: `${word} (${w.partOfSpeech || 'word'}): ${meaning}`
      })

      // 2. Fill in the blank question
      const sentenceCandidate = w.exampleSentence || `I use this _______ in my daily routine.`
      const maskedSentence = maskSentence(sentenceCandidate, word, word)
      const distractors = words.filter((_, i) => i !== idx).map(item => item.word).filter(Boolean)
      const wordOptions = [word, ...distractors, 'improve', 'challenge'].slice(0, 4).sort(() => Math.random() - 0.5)

      list.push({
        id: `fib_${word}_${idx}`,
        word,
        type: 'fill_in_blank',
        title: t('learning.practiceTitleFIB', 'Choose the correct word for the blank:'),
        sentence: maskedSentence,
        translation: w.exampleTranslation,
        options: wordOptions,
        correctAnswer: word,
        explanation: `Complete sentence: "${w.exampleSentence || maskedSentence.replace('_______', word)}"`
      })
    })

    return list
  }, [words, t])

  // Active question list: prioritize AI-generated questions
  const questions = useMemo(() => {
    if (propQuestions && propQuestions.length > 0) {
      return propQuestions
    }
    return fallbackQuestions
  }, [propQuestions, fallbackQuestions])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)

  // Reset indices if new question set is provided (e.g. refreshed by AI)
  useEffect(() => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setCorrectCount(0)
    setStreak(0)
  }, [propQuestions])

  // Ensure top of page whenever current question changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }, [currentIndex])

  if (loading || refreshing) {
    return (
      <div className="practice-step animate-fade-in">
        <div className="practice-step__ai-loader card-base">
          <div className="practice-step__ai-sparkle">
            <span className="material-symbols-outlined spinning">auto_awesome</span>
          </div>
          <h3 className="practice-step__ai-title">
            {refreshing
              ? t('learning.refreshingAIQuestionsTitle', 'Đang làm mới câu hỏi AI...')
              : t('learning.generatingAIQuestionsTitle', 'Đang tạo câu hỏi luyện tập AI...')}
          </h3>
          <p className="practice-step__ai-desc">
            {refreshing
              ? t('learning.refreshingAIQuestionsDesc', 'LexiGrow AI đang tạo tình huống hoàn toàn mới cho các từ vựng này...')
              : t('learning.generatingAIQuestionsDesc', 'LexiGrow AI đang xây dựng ngữ cảnh và câu hỏi tình huống mới lạ cho từ vựng của bạn...')}
          </p>
          <div className="practice-step__skeleton-bar">
            <div className="practice-step__skeleton-fill" />
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="practice-step__empty card-base">
        <p>{t('learning.noWordsFound', 'Không có câu hỏi luyện tập cho bài học này.')}</p>
        <button className="btn-primary" onClick={onComplete}>
          {t('learning.proceedWriting', 'Chuyển sang Luyện Viết')}
        </button>
      </div>
    )
  }

  const currentQ = questions[currentIndex] || questions[0]
  const isCorrect = isAnswered && safeLower(selectedAnswer) === safeLower(currentQ.correctAnswer)

  const handleSelectOption = (option) => {
    if (isAnswered) return
    setSelectedAnswer(option)
    setIsAnswered(true)

    const correct = safeLower(option) === safeLower(currentQ.correctAnswer)
    if (correct) {
      setCorrectCount(prev => prev + 1)
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    setSelectedAnswer(null)
    setIsAnswered(false)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onComplete?.({
        total: questions.length,
        correct: correctCount + (isCorrect ? 1 : 0),
        score: correctCount + (isCorrect ? 1 : 0),
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
            style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
          />
        </div>
        <div className="practice-step__meta-row">
          <span className="text-label-md practice-step__counter">
            {t('learning.questionCounter', `Câu hỏi ${currentIndex + 1} / ${questions.length}`, {
              current: currentIndex + 1,
              total: questions.length,
            })}
          </span>
          <div className="practice-step__header-actions">
            {streak > 1 && (
              <div className="practice-step__streak-badge">
                <span className="material-symbols-outlined">local_fire_department</span>
                <span>{t('learning.streakBadge', `Chuỗi đúng x${streak}!`, { streak })}</span>
              </div>
            )}
            {onRefresh && (
              <button
                type="button"
                className="practice-step__btn-refresh"
                onClick={onRefresh}
                disabled={refreshing}
                title={t('learning.newAIQuestionsTooltip', 'Tạo bộ câu hỏi AI hoàn toàn mới')}
              >
                <span className={`material-symbols-outlined ${refreshing ? 'spinning' : ''}`}>
                  auto_awesome
                </span>
                <span>{refreshing ? t('learning.generating', 'Đang tạo...') : t('learning.newAIQuestions', 'Tạo câu hỏi AI mới')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="practice-step__card card-base">
        <div className="practice-step__type-badge-row">
          <div className="practice-step__type-badge">
            <span className="material-symbols-outlined">
              {currentQ.type === 'multiple_choice' ? 'quiz' : 'edit_note'}
            </span>
            <span>
              {currentQ.type === 'multiple_choice'
                ? t('learning.vocabQuiz', 'Trắc nghiệm từ vựng')
                : t('learning.contextFIB', 'Điền từ theo ngữ cảnh')}
            </span>
          </div>
          <span className="practice-step__ai-pill">
            <span className="material-symbols-outlined">auto_awesome</span>
            {t('learning.aiGenerated', 'AI Tự Động Tạo')}
          </span>
        </div>

        <h3 className="practice-step__title">{currentQ.title}</h3>

        {currentQ.sentence && (
          <div className="practice-step__sentence-box">
            <p className="practice-step__sentence-text">
              {currentQ.sentence.includes('_______') ? (
                currentQ.sentence.split('_______').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="practice-step__blank-slot">
                        {isAnswered ? (
                          <span className={`practice-step__filled-word ${isCorrect ? 'practice-step__filled-word--correct' : 'practice-step__filled-word--wrong'}`}>
                            {selectedAnswer || '_______'}
                          </span>
                        ) : (
                          <span className="practice-step__blank-indicator">_______</span>
                        )}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                currentQ.sentence
              )}
            </p>
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
                  {isCorrect ? t('learning.correct', 'Chính xác!') : t('learning.incorrect', 'Chưa chính xác!')}
                </p>
                <p className="practice-step__feedback-exp">{currentQ.explanation}</p>
              </div>
            </div>

            <button className="btn-primary practice-step__btn-continue" onClick={handleNext}>
              {currentIndex < questions.length - 1
                ? t('learning.nextQuestion', 'Câu tiếp theo')
                : t('learning.proceedWriting', 'Chuyển sang Luyện Viết')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>

      <div className="practice-step__footer">
        <button className="btn-secondary" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
          {t('learning.reviewVocabulary', 'Ôn lại từ vựng')}
        </button>
      </div>
    </div>
  )
}
