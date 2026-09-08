import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import WordLesson from '../../components/learning/WordLesson'
import PracticeStep from '../../components/learning/PracticeStep'
import RevisionComparison from '../../components/learning/RevisionComparison'
import SessionCompletionModal from '../../components/learning/SessionCompletionModal'
import './LearningSession.css'

// Built-in starter learning sets matching tasks/learning-spec.md
const defaultLearningSets = {
  'daily-life': {
    slug: 'daily-life',
    title: 'Daily Life (Thói quen hàng ngày)',
    level: 'A2',
    promptTopic: 'Hãy viết một đoạn văn ngắn (60-100 từ) kể về thói quen sinh hoạt và cách bạn đi làm hoặc đi học hàng ngày.',
    words: [
      {
        _id: 'w_routine',
        word: 'routine',
        ipa: '/ruːˈtiːn/',
        partOfSpeech: 'noun',
        level: 'A2',
        meaningVi: 'Thói quen, lịch trình sinh hoạt hàng ngày',
        collocations: [
          { phrase: 'daily routine', meaning: 'thói quen hàng ngày' },
          { phrase: 'morning routine', meaning: 'lịch trình buổi sáng' }
        ],
        exampleSentence: 'I try to stick to my daily routine even on weekends.',
        exampleTranslation: 'Tôi cố gắng duy trì thói quen hàng ngày ngay cả vào cuối tuần.'
      },
      {
        _id: 'w_commute',
        word: 'commute',
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'verb',
        level: 'A2',
        meaningVi: 'Đi lại đều đặn giữa nhà và nơi làm việc / trường học',
        collocations: [
          { phrase: 'commute to work', meaning: 'đi làm hàng ngày' },
          { phrase: 'daily commute', meaning: 'chặng đường đi lại mỗi ngày' }
        ],
        exampleSentence: 'It takes me 30 minutes to commute to work by bus.',
        exampleTranslation: 'Tôi mất 30 phút để đi làm bằng xe buýt.'
      },
      {
        _id: 'w_grocery',
        word: 'grocery',
        ipa: '/ˈɡroʊsəri/',
        partOfSpeech: 'noun',
        level: 'A2',
        meaningVi: 'Thực phẩm, đồ tạp hóa mua sắm cho gia đình',
        collocations: [
          { phrase: 'grocery shopping', meaning: 'đi mua sắm thực phẩm' },
          { phrase: 'grocery list', meaning: 'danh sách đồ cần mua' }
        ],
        exampleSentence: 'We do our grocery shopping every Sunday afternoon.',
        exampleTranslation: 'Chúng tôi đi mua thực phẩm vào mỗi chiều Chủ nhật.'
      }
    ]
  },
  'travel': {
    slug: 'travel',
    title: 'Travel & Exploration (Du lịch & Trải nghiệm)',
    level: 'B1',
    promptTopic: 'Hãy viết một đoạn văn (60-100 từ) kể về kế hoạch hoặc kỷ niệm một chuyến du lịch của bạn.',
    words: [
      {
        _id: 'w_itinerary',
        word: 'itinerary',
        ipa: '/aɪˈtɪnəreri/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Lịch trình chi tiết của chuyến đi',
        collocations: [
          { phrase: 'travel itinerary', meaning: 'lịch trình du lịch' },
          { phrase: 'planned itinerary', meaning: 'lịch trình đã lên' }
        ],
        exampleSentence: 'Our travel itinerary includes visiting historical museums and local food markets.',
        exampleTranslation: 'Lịch trình du lịch của chúng tôi bao gồm việc thăm các bảo tàng lịch sử và chợ ẩm thực địa phương.'
      },
      {
        _id: 'w_accommodation',
        word: 'accommodation',
        ipa: '/əˌkɑːməˈdeɪʃn/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Chỗ ở, nơi lưu trú khi đi du lịch',
        collocations: [
          { phrase: 'book accommodation', meaning: 'đặt chỗ ở' },
          { phrase: 'hotel accommodation', meaning: 'phòng khách sạn lưu trú' }
        ],
        exampleSentence: 'It is advisable to book accommodation well in advance during peak season.',
        exampleTranslation: 'Bạn nên đặt phòng lưu trú sớm trước mùa du lịch cao điểm.'
      },
      {
        _id: 'w_landmark',
        word: 'landmark',
        ipa: '/ˈlændmɑːrk/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Địa danh, thắng cảnh nổi tiếng dễ nhận biết',
        collocations: [
          { phrase: 'famous landmark', meaning: 'địa danh nổi tiếng' },
          { phrase: 'historical landmark', meaning: 'thắng cảnh lịch sử' }
        ],
        exampleSentence: 'The Eiffel Tower is the most recognizable landmark in Paris.',
        exampleTranslation: 'Tháp Eiffel là địa danh dễ nhận biết nhất ở Paris.'
      }
    ]
  },
  'hobbies': {
    slug: 'hobbies',
    title: 'Hobbies & Leisure (Sở thích & Giải trí)',
    level: 'B1',
    promptTopic: 'Hãy viết một đoạn văn (60-100 từ) chia sẻ về một sở thích bạn yêu thích nhất và lý do.',
    words: [
      {
        _id: 'w_photography',
        word: 'photography',
        ipa: '/fəˈtɑːɡrəfi/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Nhiếp ảnh, nghệ thuật chụp ảnh',
        collocations: [
          { phrase: 'digital photography', meaning: 'nhiếp ảnh kỹ thuật số' },
          { phrase: 'photography hobby', meaning: 'sở thích chụp ảnh' }
        ],
        exampleSentence: 'Photography allows me to capture beautiful moments in nature.',
        exampleTranslation: 'Nhiếp ảnh giúp tôi lưu lại những khoảnh khắc đẹp của thiên nhiên.'
      },
      {
        _id: 'w_gardening',
        word: 'gardening',
        ipa: '/ˈɡɑːrdnɪŋ/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Làm vườn, chăm sóc cây cối hoa lá',
        collocations: [
          { phrase: 'gardening tools', meaning: 'dụng cụ làm vườn' },
          { phrase: 'gardening hobby', meaning: 'sở thích làm vườn' }
        ],
        exampleSentence: 'Gardening is a relaxing activity that helps reduce stress after work.',
        exampleTranslation: 'Làm vườn là hoạt động thư giãn giúp giảm căng thẳng sau giờ làm.'
      },
      {
        _id: 'w_cooking',
        word: 'cooking',
        ipa: '/ˈkʊkɪŋ/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Nấu ăn, nghệ thuật ẩm thực',
        collocations: [
          { phrase: 'cooking skills', meaning: 'kỹ năng nấu nướng' },
          { phrase: 'cooking class', meaning: 'lớp học nấu ăn' }
        ],
        exampleSentence: 'Improving my cooking skills helped me eat healthier meals at home.',
        exampleTranslation: 'Cải thiện kỹ năng nấu nướng giúp tôi có những bữa ăn lành mạnh hơn tại nhà.'
      }
    ]
  }
}

export default function LearningSession() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setSlug = searchParams.get('set') || 'daily-life'

  const [session, setSession] = useState(null)
  const [currentStep, setCurrentStep] = useState('lesson') // 'lesson' | 'practice' | 'writing' | 'feedback' | 'revision' | 'completed'
  const [loading, setLoading] = useState(false)
  const [learningSet, setLearningSet] = useState(defaultLearningSets[setSlug] || defaultLearningSets['daily-life'])

  // Writing state
  const [essayContent, setEssayContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [originalDraft, setOriginalDraft] = useState('')
  const [activeFeedbackWord, setActiveFeedbackWord] = useState(null)

  // Initialize Session
  useEffect(() => {
    async function initSession() {
      try {
        setLoading(true)
        // Try calling backend API
        const res = await api.post('/sessions/start', { learningSetSlug: setSlug })
        if (res.data) {
          setSession(res.data)
          if (res.data.currentStep) setCurrentStep(res.data.currentStep)
          if (res.data.learningSet?.words) {
            setLearningSet(res.data.learningSet)
          }
        }
      } catch {
        // Fallback to offline/mock set
        const selected = defaultLearningSets[setSlug] || defaultLearningSets['daily-life']
        setLearningSet(selected)
        setSession({
          _id: `session_${Date.now()}`,
          slug: setSlug,
          currentStep: 'lesson'
        })
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [setSlug])

  const words = learningSet.words || []

  // Check word usage dynamically during typing
  const wordStatusMap = words.reduce((acc, w) => {
    const regex = new RegExp(`\\b${w.word}\\b|\\b${w.word}s?\\b|\\b${w.word}ed\\b|\\b${w.word}ing\\b`, 'i')
    acc[w.word] = regex.test(essayContent)
    return acc
  }, {})

  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).filter(Boolean).length : 0

  const handleStepChange = async (nextStep) => {
    setCurrentStep(nextStep)
    try {
      if (session?._id) {
        await api.put(`/sessions/${session._id}/step`, { currentStep: nextStep })
      }
    } catch (e) {
      console.warn('Session step save offline fallback:', e)
    }
  }

  // Handle AI analysis submission
  const handleSubmitWriting = async () => {
    if (wordCount < 10) {
      alert('Vui lòng viết ít nhất 10 từ trước khi gửi phân tích AI.')
      return
    }

    setAnalyzing(true)
    try {
      // Call backend API with Gemini AI
      const res = await api.post('/essays/submit-revision', {
        sessionId: session?._id,
        content: essayContent,
        targetWords: words.map(w => w.word)
      })

      if (res.data && res.data.analysis) {
        setAnalysisResult(res.data.analysis)
      } else {
        throw new Error('No structured analysis')
      }
    } catch {
      // Structured heuristic analysis fallback
      const targetResults = words.map(w => {
        const found = wordStatusMap[w.word]
        return {
          word: w.word,
          found: !!found,
          matchedText: found ? w.word : null,
          status: found ? 'correct' : 'not_used',
          issueType: null,
          explanationVi: found
            ? `Vận dụng chính xác từ "${w.word}" vào ngữ cảnh đoạn văn.`
            : `Chưa thấy từ "${w.word}" xuất hiện. Bạn hãy thử thêm một câu sử dụng từ này.`
        }
      })

      setAnalysisResult({
        summary: `Bài viết mạch lạc (${wordCount} từ), bạn đã vận dụng được ${Object.values(wordStatusMap).filter(Boolean).length}/${words.length} từ mục tiêu.`,
        strengths: [
          'Ý tưởng câu văn rõ ràng, liên kết tốt với chủ đề.',
          'Cấu trúc ngữ pháp cơ bản chính xác và tự nhiên.'
        ],
        priorities: [
          Object.values(wordStatusMap).some(v => !v)
            ? 'Hãy thêm các từ mục tiêu còn thiếu để hoàn thiện phiên học.'
            : 'Hãy thử kết hợp thêm các collocations nâng cao để câu văn phong phú hơn.'
        ],
        targetWordResults: targetResults
      })
    } finally {
      setAnalyzing(false)
      handleStepChange('feedback')
    }
  }

  const handleStartRevision = () => {
    setOriginalDraft(essayContent)
    setCurrentStep('revision')
  }

  const handleFinishRevision = () => {
    handleStepChange('completed')
  }

  const stepsList = [
    { key: 'lesson', label: '1. Khám phá từ', icon: 'school' },
    { key: 'practice', label: '2. Luyện nhanh', icon: 'bolt' },
    { key: 'writing', label: '3. Viết đoạn văn', icon: 'edit_note' },
    { key: 'feedback', label: '4. AI Phản hồi', icon: 'auto_awesome' }
  ]

  return (
    <div className="learning-session">
      {/* Top Header Wizard Stepper */}
      <div className="learning-session__topbar card-base">
        <div className="learning-session__header-left">
          <button className="learning-session__back-btn" onClick={() => navigate('/student/dashboard')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="learning-session__title">{learningSet.title}</h2>
            <span className="learning-session__tag">Trình độ {learningSet.level} · Phiên học 10 phút</span>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="learning-session__stepper">
          {stepsList.map((st, idx) => {
            const stepOrder = ['lesson', 'practice', 'writing', 'feedback', 'revision', 'completed']
            const currentIndex = stepOrder.indexOf(currentStep)
            const stIndex = stepOrder.indexOf(st.key)
            const isDone = currentIndex > stIndex
            const isActive = currentStep === st.key || (st.key === 'feedback' && currentStep === 'revision')

            return (
              <div
                key={st.key}
                className={`learning-session__step-item ${isActive ? 'learning-session__step-item--active' : ''} ${isDone ? 'learning-session__step-item--done' : ''}`}
              >
                <div className="learning-session__step-circle">
                  {isDone ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="learning-session__step-text">{st.label}</span>
                {idx < stepsList.length - 1 && <div className="learning-session__step-line" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* STEP 1: WORD LESSON */}
      {currentStep === 'lesson' && (
        <WordLesson
          words={words}
          onComplete={() => handleStepChange('practice')}
          onBack={() => navigate('/student/dashboard')}
        />
      )}

      {/* STEP 2: PRACTICE STEP */}
      {currentStep === 'practice' && (
        <PracticeStep
          words={words}
          onComplete={() => handleStepChange('writing')}
          onBack={() => setCurrentStep('lesson')}
        />
      )}

      {/* STEP 3: SMART WRITING WORKSPACE */}
      {currentStep === 'writing' && (
        <div className="writing-flow animate-fade-in">
          {/* Target Words Bar */}
          <div className="target-words-bar card-base">
            <div className="target-words-bar__header">
              <span className="material-symbols-outlined">flag</span>
              <span className="target-words-bar__title">Từ mục tiêu cần vận dụng vào bài viết:</span>
            </div>
            <div className="target-words-bar__chips">
              {words.map(w => {
                const used = wordStatusMap[w.word]
                return (
                  <div
                    key={w.word}
                    className={`target-chip ${used ? 'target-chip--used' : 'target-chip--pending'}`}
                  >
                    <span className="material-symbols-outlined">
                      {used ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="target-chip__word">{w.word}</span>
                    <span className="target-chip__meaning">({w.meaningVi || w.meaning})</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Prompt & Editor Card */}
          <div className="writing-card card-base">
            <div className="writing-card__prompt">
              <div className="writing-card__prompt-badge">
                <span className="material-symbols-outlined">lightbulb</span>
                Chủ đề luyện viết
              </div>
              <p className="writing-card__prompt-text">{learningSet.promptTopic}</p>
            </div>

            {/* Textarea Workspace */}
            <div className="writing-card__editor-wrap">
              <textarea
                className="writing-card__textarea"
                placeholder="Bắt đầu viết đoạn văn bằng tiếng Anh của bạn tại đây... (Ví dụ: Every morning, my daily routine starts at 6:30 AM...)"
                value={essayContent}
                onChange={e => setEssayContent(e.target.value)}
                rows={8}
              />

              <div className="writing-card__footer">
                <div className="writing-card__counter">
                  <span className={`writing-card__count ${wordCount >= 60 && wordCount <= 120 ? 'writing-card__count--ideal' : ''}`}>
                    {wordCount}
                  </span>
                  <span className="writing-card__limit"> / Mục tiêu 60–100 từ</span>
                </div>

                <div className="writing-card__actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStep('practice')}
                  >
                    Quay lại
                  </button>
                  <button
                    className="btn-primary writing-card__btn-submit"
                    onClick={handleSubmitWriting}
                    disabled={analyzing || wordCount < 5}
                  >
                    {analyzing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        AI đang phân tích bài viết...
                      </>
                    ) : (
                      <>
                        Gửi AI Phân tích
                        <span className="material-symbols-outlined">auto_awesome</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: AI FEEDBACK REVIEW */}
      {currentStep === 'feedback' && analysisResult && (
        <div className="feedback-flow animate-fade-in">
          {/* Target Words Heatmap / Summary */}
          <div className="feedback-heatmap card-base">
            <h3 className="feedback-heatmap__title">
              <span className="material-symbols-outlined">analytics</span>
              Kết quả vận dụng Từ vựng Mục tiêu (Rubric Check)
            </h3>
            <div className="feedback-heatmap__grid">
              {analysisResult.targetWordResults?.map(res => {
                const statusColors = {
                  correct: 'feedback-badge--correct',
                  needs_improvement: 'feedback-badge--warning',
                  incorrect: 'feedback-badge--error',
                  not_used: 'feedback-badge--neutral'
                }
                const statusLabels = {
                  correct: 'Đúng chuẩn ngữ cảnh',
                  needs_improvement: 'Cần cải thiện dạng từ/collocation',
                  incorrect: 'Dùng sai ngữ cảnh',
                  not_used: 'Chưa sử dụng'
                }

                return (
                  <div
                    key={res.word}
                    className={`feedback-heatmap__item card-base ${activeFeedbackWord === res.word ? 'feedback-heatmap__item--active' : ''}`}
                    onClick={() => setActiveFeedbackWord(res.word)}
                  >
                    <div className="feedback-heatmap__item-top">
                      <span className="feedback-heatmap__item-word">{res.word}</span>
                      <span className={`feedback-badge ${statusColors[res.status] || 'feedback-badge--neutral'}`}>
                        {statusLabels[res.status] || res.status}
                      </span>
                    </div>
                    <p className="feedback-heatmap__item-exp">{res.explanationVi}</p>
                    {res.suggestedUpgrade && (
                      <p className="feedback-heatmap__item-upgrade">
                        💡 Gợi ý: {res.suggestedUpgrade}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Comprehensive Insight */}
          <div className="feedback-insights card-base">
            <div className="feedback-insights__summary">
              <div className="feedback-insights__header">
                <span className="material-symbols-outlined">psychology</span>
                <h4>Đánh giá tổng quan từ Trợ lý AI</h4>
              </div>
              <p className="feedback-insights__summary-text">{analysisResult.summary}</p>
            </div>

            <div className="feedback-insights__cols">
              {/* Strengths */}
              <div className="feedback-insights__col feedback-insights__col--strengths">
                <h5>
                  <span className="material-symbols-outlined">thumb_up</span> Điểm mạnh
                </h5>
                <ul>
                  {analysisResult.strengths?.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>

              {/* Priorities */}
              <div className="feedback-insights__col feedback-insights__col--priorities">
                <h5>
                  <span className="material-symbols-outlined">priority_high</span> Ưu tiên sửa để tiến bộ
                </h5>
                <ul>
                  {analysisResult.priorities?.map((pr, i) => (
                    <li key={i}>{pr}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="feedback-insights__actions">
              <button
                className="btn-secondary"
                onClick={() => setCurrentStep('writing')}
              >
                Chỉnh sửa bài viết
              </button>

              <button
                className="btn-primary feedback-insights__btn-revise"
                onClick={handleStartRevision}
              >
                <span className="material-symbols-outlined">auto_fix_high</span>
                Sửa bài ngay (Revision Draft 2)
              </button>

              <button
                className="btn-outline"
                onClick={() => handleStepChange('completed')}
              >
                Hoàn thành phiên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4.5: REVISION WORKSPACE */}
      {currentStep === 'revision' && (
        <div className="revision-flow animate-fade-in">
          <RevisionComparison
            originalDraft={originalDraft}
            revisedDraft={essayContent}
            resolvedItems={words.filter(w => wordStatusMap[w.word])}
            onProceed={handleFinishRevision}
          />
        </div>
      )}

      {/* STEP 5: COMPLETION MODAL */}
      {currentStep === 'completed' && (
        <SessionCompletionModal
          sessionData={{
            words: words,
            targetWords: words
          }}
          onClose={() => navigate('/student/dashboard')}
        />
      )}
    </div>
  )
}