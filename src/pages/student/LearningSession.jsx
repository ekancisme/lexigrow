import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { isValidLearningEssayWordCount } from '../../utils/learningEssay.js'
import WordLesson from '../../components/learning/WordLesson'
import PracticeStep from '../../components/learning/PracticeStep'
import RevisionComparison from '../../components/learning/RevisionComparison'
import SessionCompletionModal from '../../components/learning/SessionCompletionModal'
import AIFeedbackReview from './AIFeedbackReview'
import './LearningSession.css'

const readStoredDraft = (key) => {
  try {
    const draft = JSON.parse(localStorage.getItem(key) || 'null')
    return typeof draft?.content === 'string' ? draft : null
  } catch {
    return null
  }
}

// Built-in starter learning sets matching tasks/learning-spec.md
const defaultLearningSets = {
  'daily-life': {
    slug: 'daily-life',
    title: 'Daily Life & Routines',
    level: 'A2',
    promptTopic: 'Write a short paragraph (60-100 words) describing your daily routines and how you commute to work or school.',
    words: [
      {
        _id: 'w_routine',
        word: 'routine',
        ipa: '/ruːˈtiːn/',
        partOfSpeech: 'noun',
        level: 'A2',
        meaningVi: 'Daily habit, regular schedule or procedure',
        collocations: [
          { phrase: 'daily routine', meaning: 'regular day-to-day habits' },
          { phrase: 'morning routine', meaning: 'morning schedule and habits' }
        ],
        exampleSentence: 'I try to stick to my daily routine even on weekends.',
        exampleTranslation: 'I try to stick to my daily routine even on weekends.'
      },
      {
        _id: 'w_commute',
        word: 'commute',
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'verb',
        level: 'A2',
        meaningVi: 'To travel regularly between home and work or school',
        collocations: [
          { phrase: 'commute to work', meaning: 'travel to work daily' },
          { phrase: 'daily commute', meaning: 'the journey to and from work every day' }
        ],
        exampleSentence: 'It takes me 30 minutes to commute to work by bus.',
        exampleTranslation: 'It takes me 30 minutes to commute to work by bus.'
      },
      {
        _id: 'w_grocery',
        word: 'grocery',
        ipa: '/ˈɡroʊsəri/',
        partOfSpeech: 'noun',
        level: 'A2',
        meaningVi: 'Food and other items bought in a food store',
        collocations: [
          { phrase: 'grocery shopping', meaning: 'buying everyday food and essentials' },
          { phrase: 'grocery list', meaning: 'shopping list for groceries' }
        ],
        exampleSentence: 'We do our grocery shopping every Sunday afternoon.',
        exampleTranslation: 'We do our grocery shopping every Sunday afternoon.'
      }
    ]
  },
  'travel': {
    slug: 'travel',
    title: 'Travel & Exploration',
    level: 'B1',
    promptTopic: 'Write a short paragraph (60-100 words) describing a travel experience or future travel plan.',
    words: [
      {
        _id: 'w_itinerary',
        word: 'itinerary',
        ipa: '/aɪˈtɪnəreri/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'A planned route or journey schedule',
        collocations: [
          { phrase: 'travel itinerary', meaning: 'detailed schedule for a trip' },
          { phrase: 'planned itinerary', meaning: 'established travel plan' }
        ],
        exampleSentence: 'Our travel itinerary includes visiting historical museums and local food markets.',
        exampleTranslation: 'Our travel itinerary includes visiting historical museums and local food markets.'
      },
      {
        _id: 'w_accommodation',
        word: 'accommodation',
        ipa: '/əˌkɑːməˈdeɪʃn/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'A room or building to live in or stay during travel',
        collocations: [
          { phrase: 'book accommodation', meaning: 'reserve a place to stay' },
          { phrase: 'hotel accommodation', meaning: 'staying in a hotel room' }
        ],
        exampleSentence: 'It is advisable to book accommodation well in advance during peak season.',
        exampleTranslation: 'It is advisable to book accommodation well in advance during peak season.'
      },
      {
        _id: 'w_landmark',
        word: 'landmark',
        ipa: '/ˈlændmɑːrk/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'A recognizable or notable object or building',
        collocations: [
          { phrase: 'famous landmark', meaning: 'well-known monument or sight' },
          { phrase: 'historical landmark', meaning: 'historically significant site' }
        ],
        exampleSentence: 'The Eiffel Tower is the most recognizable landmark in Paris.',
        exampleTranslation: 'The Eiffel Tower is the most recognizable landmark in Paris.'
      }
    ]
  },
  'hobbies': {
    slug: 'hobbies',
    title: 'Hobbies & Leisure',
    level: 'B1',
    promptTopic: 'Write a short paragraph (60-100 words) sharing your favorite hobby and why you enjoy it.',
    words: [
      {
        _id: 'w_photography',
        word: 'photography',
        ipa: '/fəˈtɑːɡrəfi/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'The art or practice of taking photographs',
        collocations: [
          { phrase: 'digital photography', meaning: 'capturing images digitally' },
          { phrase: 'photography hobby', meaning: 'interest in taking photos' }
        ],
        exampleSentence: 'Photography allows me to capture beautiful moments in nature.',
        exampleTranslation: 'Photography allows me to capture beautiful moments in nature.'
      },
      {
        _id: 'w_gardening',
        word: 'gardening',
        ipa: '/ˈɡɑːrdnɪŋ/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'The activity of tending and cultivating a garden',
        collocations: [
          { phrase: 'gardening tools', meaning: 'implements used for gardening' },
          { phrase: 'gardening hobby', meaning: 'growing plants as a pastime' }
        ],
        exampleSentence: 'Gardening is a relaxing activity that helps reduce stress after work.',
        exampleTranslation: 'Gardening is a relaxing activity that helps reduce stress after work.'
      },
      {
        _id: 'w_cooking',
        word: 'cooking',
        ipa: '/ˈkʊkɪŋ/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'The practice or skill of preparing and cooking food',
        collocations: [
          { phrase: 'cooking skills', meaning: 'ability to prepare delicious meals' },
          { phrase: 'cooking class', meaning: 'instructional lesson for cooking' }
        ],
        exampleSentence: 'Improving my cooking skills helped me eat healthier meals at home.',
        exampleTranslation: 'Improving my cooking skills helped me eat healthier meals at home.'
      }
    ]
  },
  'technology': {
    slug: 'technology',
    title: 'Technology & Digital Era',
    level: 'B1',
    promptTopic: 'Write a short paragraph (60–100 words) discussing modern technology, collaboration, and digital innovation.',
    words: [
      {
        _id: 'w_innovation',
        word: 'innovation',
        ipa: '/ˌɪnəˈveɪʃn/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Sự đổi mới, sáng kiến công nghệ mới',
        collocations: [
          { phrase: 'technological innovation', meaning: 'đổi mới công nghệ' },
          { phrase: 'foster innovation', meaning: 'thúc đẩy đổi mới' },
        ],
        exampleSentence: 'Technological innovation has transformed the way people communicate.',
        exampleTranslation: 'Đổi mới công nghệ đã biến đổi cách mọi người giao tiếp.',
      },
      {
        _id: 'w_collaboration',
        word: 'collaboration',
        ipa: '/kəˌlæbəˈreɪʃn/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Sự cộng tác, làm việc cùng nhau hiệu quả',
        collocations: [
          { phrase: 'online collaboration', meaning: 'hợp tác trực tuyến' },
          { phrase: 'close collaboration', meaning: 'sự hợp tác chặt chẽ' },
        ],
        exampleSentence: 'Modern digital platforms encourage close collaboration among remote teams.',
        exampleTranslation: 'Các nền tảng kỹ thuật số hiện đại thúc đẩy sự hợp tác chặt chẽ giữa các nhóm làm việc từ xa.',
      },
      {
        _id: 'w_accessible',
        word: 'accessible',
        ipa: '/əkˈsesəbl/',
        partOfSpeech: 'adjective',
        level: 'B1',
        meaningVi: 'Dễ tiếp cận, có thể sử dụng rộng rãi',
        collocations: [
          { phrase: 'easily accessible', meaning: 'dễ dàng tiếp cận' },
          { phrase: 'make accessible', meaning: 'làm cho có thể tiếp cận được' },
        ],
        exampleSentence: 'Cloud computing makes learning materials accessible from any device.',
        exampleTranslation: 'Điện toán đám mây giúp tài liệu học tập có thể tiếp cận từ bất kỳ thiết bị nào.',
      },
      {
        _id: 'w_revolutionize',
        word: 'revolutionize',
        ipa: '/ˌrevəˈluːʃənaɪz/',
        partOfSpeech: 'verb',
        level: 'B2',
        meaningVi: 'Cách mạng hoá, thay đổi triệt để',
        collocations: [
          { phrase: 'revolutionize the industry', meaning: 'cách mạng hóa ngành công nghiệp' },
        ],
        exampleSentence: 'Artificial intelligence will revolutionize how students acquire new skills.',
        exampleTranslation: 'Trí tuệ nhân tạo sẽ cách mạng hóa cách học sinh tiếp thu kỹ năng mới.',
      },
    ],
  },
  'environment': {
    slug: 'environment',
    title: 'Environment & Sustainability',
    level: 'B2',
    promptTopic: 'Write a short paragraph (60–100 words) about environmental protection, ecosystems, and sustainable development.',
    words: [
      {
        _id: 'w_sustainable',
        word: 'sustainable',
        ipa: '/səˈsteɪnəbl/',
        partOfSpeech: 'adjective',
        level: 'B2',
        meaningVi: 'Bền vững, bảo vệ môi trường lâu dài',
        collocations: [
          { phrase: 'sustainable development', meaning: 'phát triển bền vững' },
          { phrase: 'sustainable energy', meaning: 'năng lượng bền vững' },
        ],
        exampleSentence: 'Adopting sustainable lifestyle habits protects natural resources for the future.',
        exampleTranslation: 'Áp dụng thói quen sống bền vững bảo vệ tài nguyên thiên nhiên cho tương lai.',
      },
      {
        _id: 'w_biodiversity',
        word: 'biodiversity',
        ipa: '/ˌbaɪoʊdaɪˈvɜːrsəti/',
        partOfSpeech: 'noun',
        level: 'B2',
        meaningVi: 'Đa dạng sinh học, sự phong phú giống loài',
        collocations: [
          { phrase: 'preserve biodiversity', meaning: 'bảo tồn đa dạng sinh học' },
        ],
        exampleSentence: 'Conserving forests is essential to preserve rich biodiversity.',
        exampleTranslation: 'Bảo tồn rừng là điều cần thiết để duy trì sự đa dạng sinh học phong phú.',
      },
      {
        _id: 'w_ecosystem',
        word: 'ecosystem',
        ipa: '/ˈiːkoʊsɪstəm/',
        partOfSpeech: 'noun',
        level: 'B2',
        meaningVi: 'Hệ sinh thái tự nhiên',
        collocations: [
          { phrase: 'fragile ecosystem', meaning: 'hệ sinh thái dễ tổn thương' },
          { phrase: 'healthy ecosystem', meaning: 'hệ sinh thái khỏe mạnh' },
        ],
        exampleSentence: 'Pollution disrupts the fragile marine ecosystem significantly.',
        exampleTranslation: 'Ô nhiễm làm xáo trộn hệ sinh thái biển dễ tổn thương một cách đáng kể.',
      },
    ],
  },
}

function AIGradingProgress({ stage = 1, progress = 15 }) {
  const stages = [
    {
      id: 1,
      title: '1. Đánh giá từ vựng mục tiêu (Target Vocabulary Check)',
      desc: 'Kiểm tra độ chính xác, ngữ cảnh và cách kết hợp collocations của các từ vựng bắt buộc.',
      icon: 'flag',
    },
    {
      id: 2,
      title: '2. Phân tích ngữ pháp & Độ phong phú từ vựng (Grammar & Lexical Diversity)',
      desc: 'Đo lường các chỉ số học thuật TTR, HD-D, MTLD và kiểm tra độ chính xác ngữ pháp.',
      icon: 'spellcheck',
    },
    {
      id: 3,
      title: '3. Đo lường mạch lạc & Đề xuất cải thiện (Coherence & Suggestions)',
      desc: 'Phát hiện từ lặp, kiểm tra cấu trúc câu phức và tổng hợp gợi ý nâng cấp diễn đạt.',
      icon: 'psychology',
    },
    {
      id: 4,
      title: '4. Hoàn thiện bảng điểm & Báo cáo chi tiết (Compiling Report)',
      desc: 'Tổng hợp nhận xét toàn diện, sẵn sàng hiển thị kết quả chấm điểm cho bạn.',
      icon: 'auto_awesome',
    },
  ]

  return (
    <div className="ai-grading-loader card-base animate-fade-in">
      <div className="ai-grading-loader__header">
        <div className="ai-grading-loader__icon-wrap">
          <span className="material-symbols-outlined ai-grading-loader__icon animate-spin">
            progress_activity
          </span>
          <span className="material-symbols-outlined ai-grading-loader__sparkle">
            auto_awesome
          </span>
        </div>
        <h2 className="ai-grading-loader__title">
          AI Agent đang chấm bài & phân tích chi tiết...
        </h2>
        <p className="ai-grading-loader__subtitle">
          Vui lòng đợi trong giây lát, chuyên gia AI đang đánh giá toàn diện bài viết theo rubric chuẩn CEFR. Kết quả sẽ tự động hiển thị ngay khi hoàn tất!
        </p>

        {/* Progress Bar */}
        <div className="ai-grading-loader__bar-container">
          <div className="ai-grading-loader__bar-header">
            <span className="ai-grading-loader__bar-label">Tiến trình chấm điểm AI</span>
            <span className="ai-grading-loader__bar-val">{progress}%</span>
          </div>
          <div className="ai-grading-loader__bar-track">
            <div
              className="ai-grading-loader__bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist of stages */}
      <div className="ai-grading-loader__steps">
        {stages.map((st) => {
          const isDone = stage > st.id || progress >= 100
          const isCurrent = stage === st.id && progress < 100
          const isPending = stage < st.id && progress < 100

          return (
            <div
              key={st.id}
              className={`ai-grading-loader__step ${
                isDone ? 'ai-grading-loader__step--done' : ''
              } ${isCurrent ? 'ai-grading-loader__step--current' : ''} ${
                isPending ? 'ai-grading-loader__step--pending' : ''
              }`}
            >
              <div className="ai-grading-loader__step-circle">
                {isDone ? (
                  <span className="material-symbols-outlined">check_circle</span>
                ) : isCurrent ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined">{st.icon}</span>
                )}
              </div>
              <div className="ai-grading-loader__step-content">
                <div className="ai-grading-loader__step-title">
                  <span>{st.title}</span>
                  {isCurrent && <span className="ai-grading-loader__badge ai-grading-loader__badge--current">Đang xử lý</span>}
                  {isDone && <span className="ai-grading-loader__badge ai-grading-loader__badge--done">Đã hoàn tất</span>}
                </div>
                <div className="ai-grading-loader__step-desc">{st.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LearningSession() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const adaptive = searchParams.get('adaptive') === 'true'
  const setSlug = searchParams.get('set') || ''

  const [session, setSession] = useState(null)
  const [currentStep, setCurrentStep] = useState('lesson') // 'lesson' | 'practice' | 'writing' | 'feedback' | 'revision' | 'completed'
  const [learningSet, setLearningSet] = useState(defaultLearningSets[setSlug] || defaultLearningSets['daily-life'])

  // Writing state
  const [essayContent, setEssayContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingStage, setAnalyzingStage] = useState(1)
  const [analyzingProgress, setAnalyzingProgress] = useState(15)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [reviewEssayId, setReviewEssayId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [draftSaveState, setDraftSaveState] = useState('')
  const [stepSaveError, setStepSaveError] = useState('')
  const [originalDraft, setOriginalDraft] = useState('')
  const [activeFeedbackWord, setActiveFeedbackWord] = useState(null)
  const draftSaveQueue = useRef(Promise.resolve())

  const draftStorageKey = `lexigrow-learning-draft:${adaptive ? 'adaptive' : setSlug}`
  const hasServerSession = /^[a-f\d]{24}$/i.test(String(session?._id || ''))

  // Initialize Session
  useEffect(() => {
    async function initSession() {
      try {
        const requestedSet = searchParams.get('set')
        const startPayload = adaptive
          ? { adaptive: true }
          : requestedSet
            ? { learningSetSlug: requestedSet }
            : { advance: true }

        const res = await api.post('/sessions/start', startPayload)
        const payload = res?.data || res
        if (payload) {
          setSession(payload)
          if (payload.originalEssay) {
            const origId = typeof payload.originalEssay === 'object'
              ? payload.originalEssay._id
              : payload.originalEssay
            if (origId) setReviewEssayId(String(origId))
            if (origId) {
              try {
                const draftRes = await api.get(`/sessions/${payload._id}/draft`)
                const serverDraft = draftRes?.data
                const localDraft = readStoredDraft(draftStorageKey)
                const localIsNewer = localDraft?.content !== undefined
                  && (!serverDraft?.updatedAt || Number(localDraft.savedAt) > new Date(serverDraft.updatedAt).getTime())
                setEssayContent(localIsNewer ? localDraft.content : (serverDraft?.content || ''))
              } catch {
                const localDraft = readStoredDraft(draftStorageKey)
                if (typeof localDraft?.content === 'string') setEssayContent(localDraft.content)
              }
            }
          } else {
            const localDraft = readStoredDraft(draftStorageKey)
            if (typeof localDraft?.content === 'string') setEssayContent(localDraft.content)
          }
          if (payload.currentStep) setCurrentStep(payload.currentStep)
          if (payload.learningSet?.words) {
            setLearningSet(payload.learningSet)
          } else {
            const slug = payload.learningSetSlug || setSlug
            const preset = defaultLearningSets[slug]

            const isAdaptiveSession = payload.sessionType === 'adaptive_recommendation' || (!slug && adaptive)

            let title = isAdaptiveSession
              ? 'Adaptive Learning Session'
              : (preset?.title || (payload.theme ? `${payload.theme} Session` : 'Smart Writing Session'))

            let promptTopic = preset?.promptTopic
            if (!promptTopic) {
              const rationale = payload.snapshot?.rationale
              if (rationale && rationale !== 'Published learning set') {
                promptTopic = rationale
              } else {
                promptTopic = 'Write a short paragraph (60–100 words) incorporating the target words into your writing.'
              }
            }

            if (payload.targetWords?.length) {
              const mappedWords = payload.targetWords.map((w, idx) => ({
                ...w,
                _id: w.wordId || w._id || `w_${w.word}_${idx}`,
                meaningVi: w.definitionVi || w.definition || w.meaningVi || '',
                exampleSentence: w.exampleSentence || w.exampleSentences?.[0] || '',
                exampleTranslation: w.exampleTranslation || '',
              }))
              setLearningSet({
                title,
                level: payload.level || preset?.level || 'B1',
                promptTopic,
                words: mappedWords,
              })
            } else if (preset) {
              setLearningSet(preset)
            }
          }

          // Keep browser URL aligned with active session so refreshing retains the correct session
          if (payload.sessionType === 'adaptive_recommendation') {
            if (!searchParams.get('adaptive')) {
              navigate('/student/writing?adaptive=true', { replace: true })
            }
          } else if (payload.learningSetSlug && searchParams.get('set') !== payload.learningSetSlug) {
            navigate(`/student/writing?set=${payload.learningSetSlug}`, { replace: true })
          }
        }
      } catch {
        // Fallback to offline/mock set
        const selected = defaultLearningSets[setSlug] || defaultLearningSets['daily-life']
        setLearningSet(selected)
        try {
          const localDraft = readStoredDraft(draftStorageKey)
          if (typeof localDraft?.content === 'string') setEssayContent(localDraft.content)
        } catch {
          // Ignore corrupted local draft data.
        }
        setSession({
          _id: `session_${Date.now()}`,
          slug: setSlug,
          currentStep: 'lesson'
        })
      }
    }
    initSession()
  }, [adaptive, draftStorageKey, setSlug])

  const words = learningSet.words || []

  // Check word usage dynamically during typing
  const wordStatusMap = words.reduce((acc, w) => {
    const regex = new RegExp(`\\b${w.word}\\b|\\b${w.word}s?\\b|\\b${w.word}ed\\b|\\b${w.word}ing\\b`, 'i')
    acc[w.word] = regex.test(essayContent)
    return acc
  }, {})

  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).filter(Boolean).length : 0

  const persistDraft = useCallback((content) => {
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify({ content, savedAt: Date.now() }))
    } catch {
      // The server draft remains the durable copy if browser storage is unavailable.
    }
    if (!hasServerSession || analyzing || session?.status === 'completed') {
      setDraftSaveState('saved')
      return Promise.resolve(null)
    }

    const save = async () => {
      setDraftSaveState('saving')
      try {
        const response = await api.put(`/sessions/${session._id}/draft`, { content })
        const saved = response?.data
        if (saved?.essayId) {
          setSession((previous) => String(previous?.originalEssay?._id || previous?.originalEssay || '') === String(saved.essayId)
            ? previous
            : { ...previous, originalEssay: saved.essayId })
          setReviewEssayId(String(saved.essayId))
        }
        setDraftSaveState('saved')
        return saved?.essayId ? String(saved.essayId) : null
      } catch (err) {
        // If 409 (Wait for the current analysis before editing the draft or Session already completed),
        // the essay content is already safely in-flight or submitted on the server.
        if (err.status === 409 || err.statusCode === 409) {
          setDraftSaveState('saved')
          return null
        }
        throw err
      }
    }
    const operation = draftSaveQueue.current.then(save, save)
    draftSaveQueue.current = operation.catch(() => {})
    return operation
  }, [draftStorageKey, hasServerSession, session, analyzing])

  useEffect(() => {
    if (!session || currentStep !== 'writing' || analyzing || session?.status === 'completed' || (!essayContent && !session.originalEssay)) return
    const timeout = setTimeout(() => {
      persistDraft(essayContent).catch((err) => {
        if (err?.status !== 409 && err?.statusCode !== 409) {
          setDraftSaveState('error')
          console.error('Learning-session draft autosave failed:', err)
        }
      })
    }, 700)
    return () => clearTimeout(timeout)
  }, [session, currentStep, analyzing, essayContent, persistDraft])

  const handleStepChange = async (nextStep) => {
    setStepSaveError('')
    try {
      if (hasServerSession) {
        await api.put(`/sessions/${session._id}/step`, { currentStep: nextStep })
      }
      setCurrentStep(nextStep)
      return true
    } catch (e) {
      setStepSaveError(e.message || 'Could not save your learning-session progress.')
      return false
    }
  }

  const handleSubmitWriting = async () => {
    if (!isValidLearningEssayWordCount(wordCount)) {
      alert('Please write 60–100 words before submitting for AI analysis.')
      return
    }
    if (!hasServerSession) {
      setSubmitError('The learning session is offline. Your draft is saved in this browser; reconnect and start the session again before submitting for AI feedback.')
      return
    }

    setAnalyzing(true)
    setAnalyzingStage(1)
    setAnalyzingProgress(18)
    setSubmitError('')
    try {
      const draftEssayId = await persistDraft(essayContent)
      const requestId = `rev_${session?._id || 'sess'}_${Date.now()}`
      const originalEssay = session?.originalEssay
      const existingEssayId = draftEssayId || reviewEssayId || (typeof originalEssay === 'object' ? originalEssay?._id : originalEssay)
      const endpoint = existingEssayId
        ? `/essays/${existingEssayId}/revisions`
        : '/essays/submit-revision'
      const payload = existingEssayId
        ? {
            content: essayContent,
            requestId,
          }
        : {
            sessionId: session?._id,
            content: essayContent,
            requestId,
          }

      // Step 1: Score target vocabulary
      const res = await api.post(endpoint, payload, {
        headers: {
          'Idempotency-Key': requestId,
        },
      })

      const revision = res?.data
      const essayId = typeof revision?.originalEssay === 'object'
        ? revision.originalEssay?._id
        : revision?.originalEssay
      if (!revision?.analysis || !essayId) throw new Error('The server response did not include the essay analysis and linked essay ID.')
      setAnalysisResult(revision.analysis)
      setReviewEssayId(String(essayId))
      setSession((previous) => ({ ...previous, originalEssay: String(essayId) }))
      setDraftSaveState('saved')
      localStorage.removeItem(draftStorageKey)

      // Step 2 & 3: Waiting for background AI essay analysis before switching screens!
      setAnalyzingStage(2)
      setAnalyzingProgress(45)

      let analysisReady = false
      let attempts = 0
      const maxAttempts = 25

      while (!analysisReady && attempts < maxAttempts) {
        attempts++
        await new Promise((r) => setTimeout(r, 1200))

        if (attempts === 3) {
          setAnalyzingStage(3)
          setAnalyzingProgress(72)
        } else if (attempts === 6) {
          setAnalyzingProgress(88)
        }

        try {
          const aRes = await api.get(`/essays/${essayId}/analysis`)
          if (aRes?.data?.scores || aRes?.data?.overallScore !== undefined) {
            analysisReady = true
          }
        } catch {
          // Still processing on server
        }
      }

      setAnalyzingStage(4)
      setAnalyzingProgress(100)
      await new Promise((r) => setTimeout(r, 600))

      setCurrentStep('feedback')
    } catch (err) {
      setSubmitError(err.message || 'The AI review could not be submitted. Your draft is still saved; please retry.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStartNextSession = async () => {
    try {
      setSession(null)
      setCurrentStep('lesson')
      setEssayContent('')
      setAnalysisResult(null)
      setReviewEssayId('')
      setOriginalDraft('')
      setSubmitError('')
      localStorage.removeItem(draftStorageKey)

      const res = await api.post('/sessions/start', { advance: true, abandonActive: true })
      const payload = res?.data || res
      if (payload) {
        setSession(payload)
        if (payload.currentStep) setCurrentStep(payload.currentStep)
        const slug = payload.learningSetSlug
        const preset = defaultLearningSets[slug]

        let title = payload.sessionType === 'adaptive_recommendation'
          ? 'Adaptive Learning Session'
          : (preset?.title || (payload.theme ? `${payload.theme} Session` : 'Smart Writing Session'))

        let promptTopic = preset?.promptTopic || (payload.snapshot?.rationale || 'Write a short paragraph (60–100 words) incorporating the target words into your writing.')

        if (payload.targetWords?.length) {
          const mappedWords = payload.targetWords.map((w, idx) => ({
            ...w,
            _id: w.wordId || w._id || `w_${w.word}_${idx}`,
            meaningVi: w.definitionVi || w.definition || w.meaningVi || '',
            exampleSentence: w.exampleSentence || w.exampleSentences?.[0] || '',
            exampleTranslation: w.exampleTranslation || '',
          }))
          setLearningSet({
            title,
            level: payload.level || preset?.level || 'B1',
            promptTopic,
            words: mappedWords,
          })
        } else if (preset) {
          setLearningSet(preset)
        }

        if (payload.sessionType === 'adaptive_recommendation') {
          navigate('/student/writing?adaptive=true', { replace: true })
        } else if (slug) {
          navigate(`/student/writing?set=${slug}`, { replace: true })
        }
      }
    } catch (err) {
      console.error('Error starting next session:', err)
      navigate('/student/dashboard')
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
    { key: 'lesson', label: '1. Explore Words', icon: 'school' },
    { key: 'practice', label: '2. Quick Practice', icon: 'bolt' },
    { key: 'writing', label: '3. Smart Writing', icon: 'edit_note' },
    { key: 'feedback', label: '4. AI Feedback', icon: 'auto_awesome' }
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
            <span className="learning-session__tag">Level {learningSet.level} · 10-Minute Session</span>
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
        analyzing ? (
          <AIGradingProgress stage={analyzingStage} progress={analyzingProgress} />
        ) : (
          <div className="writing-flow animate-fade-in">
          {/* Target Words Bar */}
          <div className="target-words-bar card-base">
            <div className="target-words-bar__header">
              <span className="material-symbols-outlined">flag</span>
              <span className="target-words-bar__title">Target words to incorporate into your writing:</span>
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

          {/* Writing Prompt Card (Đề bài tách riêng biệt) */}
          <div className="writing-prompt-card card-base">
            <div className="writing-prompt-card__header">
              <div className="writing-prompt-card__badge">
                <span className="material-symbols-outlined">lightbulb</span>
                <span>Writing Prompt / Đề bài</span>
              </div>
              <span className="writing-prompt-card__tag">Mục tiêu: 60–100 từ</span>
            </div>
            <p className="writing-prompt-card__text">{learningSet.promptTopic}</p>
          </div>

          {/* Editor Workspace Card (Khu vực viết bài riêng biệt) */}
          <div className="writing-card card-base">
            <div className="writing-card__editor-wrap">
              {submitError && (
                <div role="alert" className="card-base" style={{ marginBottom: 12, border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
                  {submitError}
                </div>
              )}
              {stepSaveError && (
                <div role="alert" className="card-base" style={{ marginBottom: 12, border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
                  {stepSaveError}
                </div>
              )}
              {draftSaveState && (
                <p role="status" aria-live="polite" style={{ margin: '0 0 8px', color: draftSaveState === 'error' ? 'var(--color-error)' : 'var(--color-on-surface-variant)' }}>
                  {draftSaveState === 'saving'
                    ? 'Đang lưu bản nháp…'
                    : draftSaveState === 'saved'
                    ? 'Bản nháp đã được lưu vào tài khoản'
                    : draftSaveState === 'local'
                    ? 'Bản nháp được lưu trên trình duyệt này'
                    : draftSaveState === 'unsaved'
                    ? 'Đang chuẩn bị lưu bản nháp…'
                    : 'Chưa thể đồng bộ nháp lên server. Bản nháp vẫn được lưu an toàn trên trình duyệt này.'}
                </p>
              )}
              <textarea
                className="writing-card__textarea"
                placeholder="Start writing your paragraph in English here... (e.g. Every morning, my daily routine starts at 6:30 AM...)"
                value={essayContent}
                onChange={e => {
                  setEssayContent(e.target.value)
                  setSubmitError('')
                  setDraftSaveState('unsaved')
                  try {
                    localStorage.setItem(draftStorageKey, JSON.stringify({ content: e.target.value, savedAt: Date.now() }))
                  } catch {
                    // Autosave will still attempt the server copy.
                  }
                }}
                rows={8}
              />

              <div className="writing-card__footer">
                <div className="writing-card__counter">
                  <span className={`writing-card__count ${wordCount >= 60 && wordCount <= 100 ? 'writing-card__count--ideal' : ''}`}>
                    {wordCount}
                  </span>
                  <span className="writing-card__limit"> / Target 60–100 words</span>
                  {!isValidLearningEssayWordCount(wordCount) && (
                    <span role="status" aria-live="polite" style={{ marginLeft: 8 }}>
                      Write between 60 and 100 words to submit.
                    </span>
                  )}
                </div>

                <div className="writing-card__actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStep('practice')}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary writing-card__btn-submit"
                    onClick={handleSubmitWriting}
                    disabled={analyzing || !isValidLearningEssayWordCount(wordCount)}
                  >
                    {analyzing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        AI is analyzing your writing...
                      </>
                    ) : (
                      <>
                        Submit for AI Analysis
                        <span className="material-symbols-outlined">auto_awesome</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* STEP 4: AI FEEDBACK REVIEW */}
      {currentStep === 'feedback' && (
        <div className="feedback-flow animate-fade-in">
          {stepSaveError && (
            <div className="card-base" role="alert" style={{ marginBottom: 16, border: '1px solid var(--color-error)' }}>
              {stepSaveError}
              <button className="btn-secondary" style={{ marginLeft: 12 }} onClick={() => handleStepChange('feedback')}>Retry</button>
            </div>
          )}

          {/* Target Words Heatmap / Summary */}
          {analysisResult?.targetWordResults && (
            <div className="feedback-heatmap card-base" style={{ marginBottom: 24 }}>
              <h3 className="feedback-heatmap__title">
                <span className="material-symbols-outlined">analytics</span>
                Target Vocabulary Application (Rubric Check)
              </h3>
              <div className="feedback-heatmap__grid">
                {analysisResult.targetWordResults.map(res => {
                  const statusColors = {
                    correct: 'feedback-badge--correct',
                    needs_improvement: 'feedback-badge--warning',
                    incorrect: 'feedback-badge--error',
                    not_used: 'feedback-badge--neutral'
                  }
                  const statusLabels = {
                    correct: 'Accurate in context',
                    needs_improvement: 'Needs form/collocation refinement',
                    incorrect: 'Inaccurate context usage',
                    not_used: 'Not used'
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
                          💡 Suggestion: {res.suggestedUpgrade}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full AI Review: The exact same production component as Essay History */}
          {reviewEssayId ? (
            <AIFeedbackReview
              essayId={reviewEssayId}
              embedded={true}
              onRevise={handleStartRevision}
              onComplete={() => handleStepChange('completed')}
            />
          ) : (
            <div className="card-base" role="alert" style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ marginTop: 12, color: 'var(--color-error)' }}>
                Không tìm thấy bài viết đã lưu để tải bảng đánh giá.
              </p>
              <button className="btn-secondary" onClick={() => handleStepChange('writing')}>Quay lại bài viết</button>
            </div>
          )}
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
          onStartNext={handleStartNextSession}
          onClose={() => navigate('/student/dashboard')}
        />
      )}
    </div>
  )
}
