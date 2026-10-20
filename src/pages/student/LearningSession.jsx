import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import { isValidLearningEssayWordCount } from '../../utils/learningEssay.js'
import { invalidateLearningPathRecommendationCache } from '../../utils/learningPathRecommendationCache.js'
import WordLesson from '../../components/learning/WordLesson'
import PracticeStep from '../../components/learning/PracticeStep'
import RevisionComparison from '../../components/learning/RevisionComparison'
import SessionCompletionModal from '../../components/learning/SessionCompletionModal'
import AIFeedbackReview from './AIFeedbackReview'
import Button from '../../components/common/Button'
import { getTopicRound, findTopicRoundByWords, TOPIC_VOCABULARY_ROUNDS } from '../../data/topicVocabularyRounds.js'
import './LearningSession.css'

const readStoredDraft = (key) => {
  try {
    const draft = JSON.parse(localStorage.getItem(key) || 'null')
    return typeof draft?.content === 'string' ? draft : null
  } catch {
    return null
  }
}

const escapeRegExp = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matchWordInText = (targetWord, text) => {
  if (!targetWord || !text) return false
  const targetNorm = targetWord.trim().normalize('NFC')
  const textNorm = text.normalize('NFC')
  const escaped = escapeRegExp(targetNorm)
  const startsWord = /^\w/u.test(targetNorm)
  const endsWord = /\w$/u.test(targetNorm)
  const prefix = startsWord ? '\\b' : ''
  const suffix = endsWord ? '\\b' : ''
  const baseRegex = new RegExp(`${prefix}${escaped}${suffix}`, 'iu')
  if (baseRegex.test(textNorm)) return true
  if (endsWord) {
    const inflectedRegex = new RegExp(`${prefix}${escaped}(?:s|ed|ing)\\b`, 'iu')
    if (inflectedRegex.test(textNorm)) return true
  }
  return false
}

const enrichLessonWords = (words = [], slug = '', level = '') => {
  const curatedWords = (TOPIC_VOCABULARY_ROUNDS[slug] || []).flatMap((round) => round.words || [])
  const curatedByWord = new Map(
    curatedWords.map((word) => [String(word.word || '').trim().normalize('NFC').toLowerCase(), word])
  )

  return words.map((word, idx) => {
    const key = String(word.word || '').trim().normalize('NFC').toLowerCase()
    const curated = curatedByWord.get(key) || {}
    const exampleSentences = word.exampleSentences || curated.exampleSentences || []

    return {
      ...curated,
      ...word,
      _id: word.wordId || word._id || `w_${word.word}_${idx}`,
      topicSlug: slug || curated.topicSlug || '',
      ipa: word.ipa || word.phonetic || curated.ipa || '',
      partOfSpeech: word.partOfSpeech || curated.partOfSpeech || '',
      level: word.level || curated.level || level,
      meaningVi: word.meaningVi || word.definitionVi || word.definition || word.meaning || curated.meaningVi || curated.meaning || '',
      collocations: word.collocations?.length ? word.collocations : (curated.collocations || []),
      exampleSentence: word.exampleSentence || exampleSentences[0] || curated.exampleSentence || '',
      exampleTranslation: word.exampleTranslation || curated.exampleTranslation || '',
    }
  })
}

// Built-in starter learning sets
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
        meaningVi: 'Thói quen hàng ngày, lịch trình quen thuộc',
        collocations: [
          { phrase: 'daily routine', meaning: 'regular day-to-day habits' },
          { phrase: 'morning routine', meaning: 'morning schedule and habits' }
        ],
        exampleSentence: 'I try to stick to my daily routine even on weekends.',
        exampleTranslation: 'Tôi cố gắng giữ vững thói quen hàng ngày ngay cả vào cuối tuần.'
      },
      {
        _id: 'w_commute',
        word: 'commute',
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'verb',
        level: 'A2',
        meaningVi: 'Đi lại đều đặn giữa nhà và nơi làm việc/học tập',
        collocations: [
          { phrase: 'daily commute', meaning: 'regular travel to work/school' }
        ],
        exampleSentence: 'Many people commute by subway to avoid rush hour traffic.',
        exampleTranslation: 'Nhiều người đi làm bằng tàu điện ngầm để tránh tắc đường giờ cao điểm.'
      }
    ]
  },
  'technology': {
    slug: 'technology',
    title: 'Technology & Digital Innovation',
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
          { phrase: 'technological innovation', meaning: 'đổi mới công nghệ' }
        ],
        exampleSentence: 'Technological innovation has transformed the way people communicate.',
        exampleTranslation: 'Đổi mới công nghệ đã biến đổi cách mọi người giao tiếp.'
      },
      {
        _id: 'w_collaboration',
        word: 'collaboration',
        ipa: '/kəˌlæbəˈreɪʃn/',
        partOfSpeech: 'noun',
        level: 'B1',
        meaningVi: 'Sự cộng tác, làm việc nhóm hiệu quả',
        collocations: [
          { phrase: 'online collaboration', meaning: 'hợp tác trực tuyến' }
        ],
        exampleSentence: 'Modern digital platforms encourage close collaboration among remote teams.',
        exampleTranslation: 'Các nền tảng số hiện đại thúc đẩy sự hợp tác chặt chẽ giữa các nhóm làm việc từ xa.'
      }
    ]
  },
  'academic': {
    slug: 'academic',
    title: 'Academic Writing & Research',
    level: 'B2',
    promptTopic: 'Write a short academic paragraph (60-100 words) evaluating evidence and analyzing scholarly outcomes.',
    words: [
      {
        _id: 'w_sustainable',
        word: 'sustainable',
        ipa: '/səˈsteɪnəbl/',
        partOfSpeech: 'adjective',
        level: 'B2',
        meaningVi: 'Bền vững, bảo vệ môi trường dài lâu',
        collocations: [
          { phrase: 'sustainable development', meaning: 'phát triển bền vững' }
        ],
        exampleSentence: 'Adopting sustainable lifestyle habits protects natural resources for the future.',
        exampleTranslation: 'Áp dụng thói quen sống bền vững bảo vệ tài nguyên thiên nhiên cho tương lai.'
      }
    ]
  }
}

// Student reviews from Figma Frame 518:5910
const FIGMA_STUDENT_REVIEWS = [
  {
    id: 'r1',
    name: 'Leonardo Da Vinci',
    avatar: '/assets/editorial/instructors/alexander.png',
    date: 'Today',
    rating: 5,
    comment: "Loved the course. I've learned some very subtle techniques, especially on academic collocations and coherence."
  },
  {
    id: 'r2',
    name: 'Titania S',
    avatar: '/assets/editorial/instructors/sarasvati.png',
    date: 'Today',
    rating: 5,
    comment: 'I loved the course, it had been a long time since I practiced academic essays and now I write with much more confidence thanks to LexiGrow Studio.'
  },
  {
    id: 'r3',
    name: 'Zhirkov',
    avatar: '/assets/editorial/instructors/jonathan.png',
    date: 'Yesterday',
    rating: 5,
    comment: 'Yes. I just emphasize that the use of academic vocabulary, for non-native writers, becomes natural to follow. Safe and very didactic teacher.'
  },
  {
    id: 'r4',
    name: 'Miphoska',
    avatar: '/assets/editorial/instructors/labie.png',
    date: '3 days ago',
    rating: 4,
    comment: 'The instant AI evaluation combined with the chapter breakdown is brilliant. The explanations are clear and quick for ambitious learners.'
  }
]

function AIGradingProgress({ stage = 1, progress = 15 }) {
  const { t } = useLanguage()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const stages = [
    {
      id: 1,
      title: t('learning.gradingStage1Title', '1. Đánh giá từ vựng mục tiêu'),
      desc: t('learning.gradingStage1Desc', 'Kiểm tra độ chính xác, ngữ cảnh và cách kết hợp collocations của các từ vựng bắt buộc.'),
      icon: 'flag',
    },
    {
      id: 2,
      title: t('learning.gradingStage2Title', '2. Phân tích ngữ pháp & Độ phong phú từ vựng'),
      desc: t('learning.gradingStage2Desc', 'Đo lường các chỉ số học thuật TTR, HD-D, MTLD và kiểm tra độ chính xác ngữ pháp.'),
      icon: 'spellcheck',
    },
    {
      id: 3,
      title: t('learning.gradingStage3Title', '3. Đo lường mạch lạc & Đề xuất cải thiện'),
      desc: t('learning.gradingStage3Desc', 'Phát hiện từ lặp, kiểm tra cấu trúc câu phức và tổng hợp gợi ý nâng cấp diễn đạt.'),
      icon: 'psychology',
    },
    {
      id: 4,
      title: t('learning.gradingStage4Title', '4. Hoàn thiện bảng điểm & Báo cáo chi tiết'),
      desc: t('learning.gradingStage4Desc', 'Tổng hợp nhận xét toàn diện, sẵn sàng hiển thị kết quả chấm điểm cho bạn.'),
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
          {t('learning.gradingTitle', 'AI Agent đang chấm bài & phân tích chi tiết...')}
        </h2>
        <p className="ai-grading-loader__subtitle">
          {t('learning.gradingSubtitle', 'Vui lòng đợi trong giây lát, chuyên gia AI đang đánh giá toàn diện bài viết theo rubric chuẩn CEFR. Kết quả sẽ tự động hiển thị ngay khi hoàn tất!')}
        </p>

        <div className="ai-grading-loader__timer" aria-live="polite">
          <span className="material-symbols-outlined ai-grading-loader__timer-icon animate-pulse">timer</span>
          <span className="ai-grading-loader__timer-label">
            {t('learning.gradingTimerLabel', 'Thời gian chấm bài:')}
          </span>
          <span className="ai-grading-loader__timer-val">{formatTime(elapsedSeconds)}</span>
          <span className="ai-grading-loader__timer-sec">({elapsedSeconds}s)</span>
        </div>

        <div className="ai-grading-loader__bar-container">
          <div className="ai-grading-loader__bar-header">
            <span className="ai-grading-loader__bar-label">
              {t('learning.gradingProgress', 'Tiến trình chấm điểm AI')}
            </span>
            <span className="ai-grading-loader__bar-val">{progress}%</span>
          </div>
          <div className="ai-grading-loader__bar-track">
            <div className="ai-grading-loader__bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

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
                  {isCurrent && (
                    <span className="ai-grading-loader__badge ai-grading-loader__badge--current">
                      {t('learning.gradingProcessing', 'Đang xử lý')}
                    </span>
                  )}
                  {isDone && (
                    <span className="ai-grading-loader__badge ai-grading-loader__badge--done">
                      {t('learning.gradingComplete', 'Đã hoàn tất')}
                    </span>
                  )}
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
  const { t, language } = useLanguage()
  const isVi = language === 'vi'
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const adaptive = searchParams.get('adaptive') === 'true'
  const setSlug = searchParams.get('set') || ''

  const [session, setSession] = useState(null)
  const [currentStep, setCurrentStep] = useState('lesson') // 'lesson' | 'practice' | 'writing' | 'feedback' | 'revision' | 'completed'
  const [learningSet, setLearningSet] = useState(defaultLearningSets[setSlug] || defaultLearningSets['daily-life'])

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoProgress, setVideoProgress] = useState(20) // percentage
  const videoTime = '12:00 / 59:00'
  const [videoVolume, setVideoVolume] = useState(80)
  const [playerCollapsed, setPlayerCollapsed] = useState(false)

  // Layout tabs matching Figma Frame 518:5910
  const [contentTab, setContentTab] = useState('practice') // 'practice' | 'about' | 'reviews'

  // Chapters accordion expansion
  const [expandedChapter, setExpandedChapter] = useState('ch2') // 'ch1' | 'ch2' | 'ch3'

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterDone, setNewsletterDone] = useState(false)

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
  const activeRequestIdRef = useRef(null)
  const lastSubmittedContentRef = useRef(null)

  // AI Practice Questions
  const [practiceQuestions, setPracticeQuestions] = useState([])
  const [loadingPractice, setLoadingPractice] = useState(false)
  const [practiceError, setPracticeError] = useState(null)
  const [refreshingPractice, setRefreshingPractice] = useState(false)

  const draftStorageKey = `lexigrow-learning-draft:${adaptive ? 'adaptive' : setSlug}`
  const hasServerSession = /^[a-f\d]{24}$/i.test(String(session?._id || ''))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentStep])

  const fetchPracticeQuestions = async (bypassCache = false) => {
    if (!session?._id) return
    if (bypassCache) setRefreshingPractice(true)
    else setLoadingPractice(true)
    setPracticeError(null)
    try {
      const qs = bypassCache ? '?bypassCache=1' : ''
      const res = await api.get(`/sessions/${session._id}/practice-questions${qs}`)
      const qList = res?.data?.data?.questions || res?.data?.questions
      if (Array.isArray(qList) && qList.length > 0) {
        setPracticeQuestions(qList)
      }
    } catch (err) {
      console.error('[PracticeQuestions] fetch failed:', err)
      setPracticeError(err?.message || 'Failed to load practice questions')
    } finally {
      setLoadingPractice(false)
      setRefreshingPractice(false)
    }
  }

  useEffect(() => {
    if (session?._id && practiceQuestions.length === 0 && !loadingPractice) {
      Promise.resolve().then(() => {
        fetchPracticeQuestions(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id, currentStep])

  // Initialize Session
  useEffect(() => {
    async function initSession() {
      try {
        const requestedSet = searchParams.get('set')
        const isPersonalizedRoadmap = searchParams.get('roadmap') === 'true'
        const isForce = searchParams.get('force') === 'true' || searchParams.get('forceSet') === 'true'
        const isAdvance = searchParams.get('advanceTopic') === 'true'
        const roundParam = parseInt(searchParams.get('round') || '1', 10)
        const startPayload = adaptive
          ? { adaptive: true }
          : requestedSet
            ? { learningSetSlug: requestedSet, forceSet: isForce, advanceTopic: isAdvance, round: roundParam, personalizedRoadmap: isPersonalizedRoadmap }
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

          const slug = payload.learningSetSlug || payload.learningSet?.slug || setSlug
          const preset = defaultLearningSets[slug]
          const isAdaptiveSession = payload.sessionType === 'adaptive_recommendation' || (!slug && adaptive)

          const rawTargetWords = payload.targetWords || payload.learningSet?.words || []
          const matchedRound = findTopicRoundByWords(slug, rawTargetWords) || (roundParam ? getTopicRound(slug, roundParam) : null)

          let title = isAdaptiveSession
            ? 'Adaptive Learning Session'
            : (matchedRound?.name || preset?.title || (payload.theme ? `${payload.theme} Session` : 'Smart Writing Session'))

          let promptTopic = payload.promptTopic ||
            payload.snapshot?.promptTopic ||
            matchedRound?.promptTopic ||
            (payload.snapshot?.rationale && payload.snapshot?.rationale !== 'Published learning set'
              ? payload.snapshot.rationale
              : (preset?.promptTopic || 'Write a short paragraph (60–100 words) incorporating the target words into your writing.'))

          if (payload.learningSet?.words) {
            setLearningSet({
              ...payload.learningSet,
              title: matchedRound?.name || payload.learningSet.title || title,
              promptTopic,
              words: enrichLessonWords(payload.learningSet.words, slug, payload.learningSet.level || payload.level),
            })
          } else if (payload.targetWords?.length) {
            const mappedWords = enrichLessonWords(payload.targetWords, slug, payload.level || preset?.level)
            setLearningSet({
              title,
              level: payload.level || preset?.level || 'B1',
              promptTopic,
              words: mappedWords,
            })
          } else if (preset) {
            const roundData = matchedRound || getTopicRound(slug, roundParam)
            if (roundData) {
              setLearningSet({
                title: roundData.name || title,
                level: preset.level || 'B1',
                promptTopic: roundData.promptTopic || promptTopic,
                words: roundData.words,
              })
            } else {
              setLearningSet(preset)
            }
          }
        }
      } catch {
        const selected = defaultLearningSets[setSlug] || defaultLearningSets['daily-life']
        setLearningSet(selected)
        setSession({
          _id: `session_${Date.now()}`,
          slug: setSlug,
          currentStep: 'lesson'
        })
      }
    }
    initSession()
  }, [adaptive, draftStorageKey, setSlug, searchParams])

  const words = learningSet.words || []

  const wordStatusMap = words.reduce((acc, w) => {
    if (!w?.word) return acc
    acc[w.word] = matchWordInText(w.word, essayContent)
    return acc
  }, {})

  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).filter(Boolean).length : 0

  const persistDraft = useCallback((content) => {
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify({ content, savedAt: Date.now() }))
    } catch {}
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
      if (nextStep === 'completed') {
        invalidateLearningPathRecommendationCache(api.getUser()?._id)
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
      alert(t('learning.wordCountValidation'))
      return
    }
    if (!hasServerSession) {
      setSubmitError(t('learning.sessionOffline'))
      return
    }

    setAnalyzing(true)
    setAnalyzingStage(1)
    setAnalyzingProgress(18)
    setSubmitError('')
    try {
      const draftEssayId = await persistDraft(essayContent)
      const subIdStorageKey = `lexigrow-sub-id:${adaptive ? 'adaptive' : setSlug}:${session?._id || 'sess'}`
      let requestId = `rev_${session?._id || 'sess'}_${Date.now()}`
      try {
        localStorage.setItem(subIdStorageKey, JSON.stringify({ content: essayContent, requestId }))
      } catch {}

      activeRequestIdRef.current = requestId
      lastSubmittedContentRef.current = essayContent

      const originalEssay = session?.originalEssay
      const existingEssayId = draftEssayId || reviewEssayId || (typeof originalEssay === 'object' ? originalEssay?._id : originalEssay)
      const endpoint = existingEssayId ? `/essays/${existingEssayId}/revisions` : '/essays/submit-revision'
      const payload = existingEssayId ? { content: essayContent, requestId } : { sessionId: session?._id, content: essayContent, requestId }

      const res = await api.post(endpoint, payload, {
        headers: { 'Idempotency-Key': requestId },
      })

      const revision = res?.data
      const essayId = typeof revision?.originalEssay === 'object' ? revision.originalEssay?._id : revision?.originalEssay
      if (!revision?.analysis || !essayId) throw new Error('The server response did not include the essay analysis.')
      setAnalysisResult(revision.analysis)
      setReviewEssayId(String(essayId))
      setSession((prev) => ({ ...prev, originalEssay: String(essayId) }))
      setDraftSaveState('saved')
      localStorage.removeItem(draftStorageKey)

      setAnalyzingStage(2)
      setAnalyzingProgress(45)

      let analysisReady = false
      let attempts = 0
      while (!analysisReady && attempts < 25) {
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
          if (!aRes?.pending && (aRes?.data?.scores || aRes?.data?.overallScore !== undefined)) {
            analysisReady = true
          }
        } catch {}
      }

      setAnalyzingStage(4)
      setAnalyzingProgress(100)
      await new Promise((r) => setTimeout(r, 600))

      setCurrentStep('feedback')
    } catch (err) {
      setSubmitError(err.message || 'AI review could not be submitted. Please retry.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStartNextSession = async () => {
    navigate('/student/dashboard')
  }

  const handleStartRevision = () => {
    setOriginalDraft(essayContent)
    setCurrentStep('revision')
  }

  const handleSaveRevision = async (revisedContent) => {
    const originalEssay = session?.originalEssay
    const essayId = reviewEssayId || (typeof originalEssay === 'object' ? originalEssay?._id : originalEssay)
    if (!essayId) throw new Error('Original essay not found.')
    const res = await api.post(`/essays/${essayId}/revisions`, {
      content: revisedContent,
      requestId: `rev_step_${session?._id || 'sess'}_${Date.now()}`,
    })
    setEssayContent(revisedContent)
    if (res?.data?.analysis) setAnalysisResult(res.data.analysis)
    return res?.data
  }

  return (
    <div className="figma-video-page animate-fade-in">
      {/* ── BREADCRUMB ── */}
      <nav className="figma-video-breadcrumb" aria-label="Breadcrumb">
        <Link to="/student/dashboard">{isVi ? 'Trang chủ' : 'Home'}</Link>
        <span>/</span>
        <Link to="/student/explore">{isVi ? 'Khoá học' : 'Courses'}</Link>
        <span>/</span>
        <span className="current">{learningSet.title}</span>
      </nav>

      {/* ── 2-COLUMN MAIN LAYOUT (Figma Frame 518:5910) ── */}
      <div className="figma-video-layout">
        {/* ── LEFT COLUMN (68% - Media Player & Interactive Work) ── */}
        <div className="figma-video-left">
          {/* Custom Video Player Container */}
          <div className={`figma-player-container ${playerCollapsed ? 'figma-player-container--collapsed' : ''}`}>
            <div className="figma-player-canvas">
              <img
                src="/assets/editorial/video-player-art.png"
                alt="Course Video Artwork"
                className="figma-player-art"
              />

              {/* Big Center Play Button Overlay */}
              <button
                type="button"
                className={`figma-center-play-btn ${isPlaying ? 'figma-center-play-btn--playing' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? 'Pause lesson' : 'Play lesson video'}
              >
                <span className="material-symbols-outlined">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Collapse/Expand Toggle Top Right */}
              <button
                type="button"
                className="figma-player-collapse-toggle"
                onClick={() => setPlayerCollapsed(!playerCollapsed)}
                title={playerCollapsed ? 'Expand video player' : 'Collapse video player'}
              >
                <span className="material-symbols-outlined">
                  {playerCollapsed ? 'unfold_more' : 'unfold_less'}
                </span>
              </button>

              {/* Video Bottom Chrome Controls Bar */}
              <div className="figma-player-controls">
                {/* Scrub bar */}
                <div
                  className="figma-scrub-bar"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)))
                    setVideoProgress(pct)
                  }}
                >
                  <div className="figma-scrub-fill" style={{ width: `${videoProgress}%` }} />
                  <div className="figma-scrub-thumb" style={{ left: `${videoProgress}%` }} />
                </div>

                <div className="figma-controls-row">
                  <div className="figma-controls-left">
                    <button
                      type="button"
                      className="figma-ctrl-btn"
                      onClick={() => setIsPlaying(!isPlaying)}
                      aria-label="Play/Pause"
                    >
                      <span className="material-symbols-outlined">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="figma-ctrl-btn"
                      onClick={() => setVideoProgress((p) => Math.max(0, p - 5))}
                      aria-label="Replay 10 seconds"
                    >
                      <span className="material-symbols-outlined">replay_10</span>
                    </button>
                    <button
                      type="button"
                      className="figma-ctrl-btn"
                      onClick={() => setVideoProgress((p) => Math.min(100, p + 5))}
                      aria-label="Forward 10 seconds"
                    >
                      <span className="material-symbols-outlined">forward_10</span>
                    </button>
                    <button
                      type="button"
                      className="figma-ctrl-btn"
                      onClick={() => setVideoVolume((v) => (v > 0 ? 0 : 80))}
                      aria-label="Volume"
                    >
                      <span className="material-symbols-outlined">
                        {videoVolume > 0 ? 'volume_up' : 'volume_off'}
                      </span>
                    </button>
                    <span className="figma-video-time">{videoTime}</span>
                  </div>

                  <div className="figma-controls-right">
                    <span className="figma-badge-hd">HD</span>
                    <button type="button" className="figma-ctrl-btn" aria-label="Closed captions">
                      <span className="material-symbols-outlined">closed_caption</span>
                    </button>
                    <button type="button" className="figma-ctrl-btn" aria-label="Settings">
                      <span className="material-symbols-outlined">settings</span>
                    </button>
                    <button type="button" className="figma-ctrl-btn" aria-label="Fullscreen">
                      <span className="material-symbols-outlined">fullscreen</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Title Heading */}
          <h1 className="figma-course-headline">
            {learningSet.title.toUpperCase()} SCRATCH COURSE
          </h1>

          {/* Instructor & Meta Row (Figma Frame 518:5910) */}
          <div className="figma-instructor-meta-row">
            <div className="figma-instructor-left">
              <img
                src="/assets/editorial/instructors/alexander.png"
                alt="LexiGrow Studio"
                className="figma-author-avatar"
              />
              <div>
                <div className="figma-author-name">LexiGrow Studio</div>
                <div className="figma-author-sub">{isVi ? 'Ban Cố Vấn IELTS & Học Thuật' : 'Academic Writing Faculty'}</div>
              </div>
            </div>

            <div className="figma-author-stats">
              <span className="figma-stat-pill">
                <span className="material-symbols-outlined">group</span>
                <span>2.3k</span>
              </span>
              <span className="figma-stat-pill">
                <span className="material-symbols-outlined">chat</span>
                <span>1.4k</span>
              </span>
            </div>
          </div>

          {/* Content Navigation Tabs */}
          <div className="figma-course-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={contentTab === 'practice'}
              className={`figma-course-tab ${contentTab === 'practice' ? 'figma-course-tab--active' : ''}`}
              onClick={() => setContentTab('practice')}
            >
              <span className="material-symbols-outlined">auto_stories</span>
              <span>{isVi ? 'Bài Luyện Tập & Viết Luận' : 'Practice & Interactive Session'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={contentTab === 'about'}
              className={`figma-course-tab ${contentTab === 'about' ? 'figma-course-tab--active' : ''}`}
              onClick={() => setContentTab('about')}
            >
              <span className="material-symbols-outlined">info</span>
              <span>{isVi ? 'Về Khoá Học' : 'About Course'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={contentTab === 'reviews'}
              className={`figma-course-tab ${contentTab === 'reviews' ? 'figma-course-tab--active' : ''}`}
              onClick={() => setContentTab('reviews')}
            >
              <span className="material-symbols-outlined">rate_review</span>
              <span>{isVi ? 'Đánh Giá Học Viên' : 'Reviews'} (4)</span>
            </button>
          </div>

          {/* ── TAB 1: INTERACTIVE PRACTICE & WRITING ── */}
          {contentTab === 'practice' && (
            <div className="figma-interactive-body animate-fade-in">
              {/* Stepper Wizard Bar */}
              <div className="figma-lesson-stepper">
                {[
                  { key: 'lesson', label: isVi ? '1. Từ vựng mục tiêu' : '1. Target Words', icon: 'school' },
                  { key: 'practice', label: isVi ? '2. Câu hỏi tương tác' : '2. Context Practice', icon: 'bolt' },
                  { key: 'writing', label: isVi ? '3. Viết bài chấm điểm' : '3. Paragraph Writing', icon: 'edit_note' },
                  { key: 'feedback', label: isVi ? '4. Chấm điểm AI' : '4. AI Feedback', icon: 'auto_awesome' },
                ].map((st) => {
                  const stepOrder = ['lesson', 'practice', 'writing', 'feedback', 'revision', 'completed']
                  const currentIndex = stepOrder.indexOf(currentStep)
                  const stIndex = stepOrder.indexOf(st.key)
                  const isDone = currentIndex > stIndex
                  const isActive = currentStep === st.key || (st.key === 'feedback' && currentStep === 'revision')

                  return (
                    <button
                      key={st.key}
                      type="button"
                      className={`figma-step-pill ${isActive ? 'figma-step-pill--active' : ''} ${isDone ? 'figma-step-pill--done' : ''}`}
                      onClick={() => handleStepChange(st.key)}
                    >
                      <span className="material-symbols-outlined figma-step-icon">
                        {isDone ? 'check' : st.icon}
                      </span>
                      <span>{st.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* STEP 1: WORD LESSON */}
              {currentStep === 'lesson' && (
                <WordLesson
                  words={words}
                  topicSlug={learningSet?.slug || setSlug}
                  topicTitle={learningSet?.title}
                  onComplete={() => handleStepChange('practice')}
                  onBack={() => navigate('/student/dashboard')}
                />
              )}

              {/* STEP 2: PRACTICE STEP */}
              {currentStep === 'practice' && (
                <PracticeStep
                  words={words}
                  questions={practiceQuestions}
                  loading={loadingPractice}
                  refreshing={refreshingPractice}
                  error={practiceError}
                  onRefresh={() => fetchPracticeQuestions(true)}
                  onComplete={() => handleStepChange('writing')}
                  onBack={() => setCurrentStep('lesson')}
                />
              )}

              {/* STEP 3: SMART WRITING WORKSPACE */}
              {currentStep === 'writing' && (
                analyzing ? (
                  <AIGradingProgress stage={analyzingStage} progress={analyzingProgress} />
                ) : (
                  <div className="figma-writing-area animate-fade-in">
                    {/* Target words chips row */}
                    <div className="figma-target-words-box">
                      <div className="figma-target-words-title">
                        <span className="material-symbols-outlined">flag</span>
                        <span>{t('learning.targetWordsPrompt', 'Target Words to Apply in Essay')}:</span>
                      </div>
                      <div className="figma-target-words-chips">
                        {words.map((w) => {
                          const used = wordStatusMap[w.word]
                          return (
                            <span
                              key={w.word}
                              className={`figma-word-chip ${used ? 'figma-word-chip--used' : ''}`}
                            >
                              <span className="material-symbols-outlined">
                                {used ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              <strong>{w.word}</strong>
                              <span className="figma-word-meaning">({w.meaningVi || w.meaning})</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Writing Prompt Card */}
                    <div className="figma-prompt-box">
                      <div className="figma-prompt-badge">
                        <span className="material-symbols-outlined">lightbulb</span>
                        <span>{isVi ? 'Đề bài thực hành' : 'Essay Prompt'}</span>
                      </div>
                      <p className="figma-prompt-text">{learningSet.promptTopic}</p>
                    </div>

                    {/* Textarea Editor Card */}
                    <div className="figma-editor-box">
                      {submitError && (
                        <div className="figma-alert-error" role="alert">
                          {submitError}
                        </div>
                      )}
                      {stepSaveError && (
                        <div className="figma-alert-error" role="alert">
                          {stepSaveError}
                        </div>
                      )}
                      {draftSaveState && (
                        <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 4 }}>
                          {draftSaveState === 'saving'
                            ? (isVi ? 'Đang lưu bản nháp…' : 'Autosaving draft…')
                            : draftSaveState === 'saved'
                              ? (isVi ? 'Bản nháp đã lưu tự động' : 'Draft saved')
                              : (isVi ? 'Có thay đổi chưa lưu' : 'Unsaved changes')}
                        </div>
                      )}

                      <textarea
                        className="figma-essay-textarea"
                        placeholder={t('learning.writePlaceholder', 'Type your paragraph here (60-100 words)...')}
                        value={essayContent}
                        onChange={(e) => {
                          setEssayContent(e.target.value)
                          setSubmitError('')
                          setDraftSaveState('unsaved')
                        }}
                        rows={8}
                      />

                      <div className="figma-editor-footer">
                        <div className="figma-word-counter">
                          <strong className={wordCount >= 60 && wordCount <= 100 ? 'figma-count-ideal' : ''}>
                            {wordCount}
                          </strong>
                          <span> / 60-100 {isVi ? 'từ' : 'words'}</span>
                          {!isValidLearningEssayWordCount(wordCount) && (
                            <span className="figma-count-hint">
                              ({isVi ? 'Cần 60–100 từ' : '60–100 required'})
                            </span>
                          )}
                        </div>

                        <div className="figma-editor-actions">
                          <Button
                            variant="secondary"
                            size="md"
                            className="figma-pill-btn"
                            onClick={() => setCurrentStep('practice')}
                          >
                            {isVi ? 'Quay lại' : 'Back'}
                          </Button>
                          <Button
                            variant="primary"
                            size="md"
                            className="figma-pill-cta"
                            onClick={handleSubmitWriting}
                            disabled={analyzing || !isValidLearningEssayWordCount(wordCount)}
                          >
                            <span>{isVi ? 'Nộp bài chấm điểm AI' : 'Submit for AI Evaluation'}</span>
                            <span className="material-symbols-outlined">auto_awesome</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* STEP 4: AI FEEDBACK */}
              {currentStep === 'feedback' && (
                <div className="figma-feedback-area animate-fade-in">
                  {analysisResult?.targetWordResults && (
                    <div className="figma-heatmap-box">
                      <h3 className="figma-heatmap-title">
                        <span className="material-symbols-outlined">analytics</span>
                        <span>{isVi ? 'Đánh Giá Từ Vựng Mục Tiêu' : 'Target Vocabulary Rubric'}</span>
                      </h3>
                      <div className="figma-heatmap-grid">
                        {analysisResult.targetWordResults.map((res) => (
                          <div
                            key={res.word}
                            className={`figma-heatmap-item ${activeFeedbackWord === res.word ? 'figma-heatmap-item--active' : ''}`}
                            onClick={() => setActiveFeedbackWord(res.word)}
                          >
                            <div className="figma-heatmap-item-top">
                              <strong>{res.word}</strong>
                              <span className={`figma-rubric-badge figma-rubric-badge--${res.status}`}>
                                {res.status}
                              </span>
                            </div>
                            <p>{res.explanationVi || res.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reviewEssayId && (
                    <AIFeedbackReview
                      essayId={reviewEssayId}
                      embedded={true}
                      onRevise={handleStartRevision}
                      onComplete={() => handleStepChange('completed')}
                    />
                  )}
                </div>
              )}

              {/* STEP 4.5: REVISION */}
              {currentStep === 'revision' && (
                <RevisionComparison
                  originalDraft={originalDraft}
                  revisedDraft={essayContent}
                  resolvedItems={words.filter((w) => wordStatusMap[w.word])}
                  onSaveRevision={handleSaveRevision}
                  onProceed={() => handleStepChange('completed')}
                />
              )}

              {/* STEP 5: COMPLETION */}
              {currentStep === 'completed' && (
                <SessionCompletionModal
                  sessionData={{ words, targetWords: words }}
                  onStartNext={handleStartNextSession}
                  onClose={() => navigate('/student/dashboard')}
                />
              )}
            </div>
          )}

          {/* ── TAB 2: ABOUT COURSE (Figma Frame 518:5910) ── */}
          {contentTab === 'about' && (
            <div className="figma-about-body animate-fade-in">
              <h3 className="figma-section-title">{isVi ? 'Tổng Quan Khoá Học' : 'About Course'}</h3>
              <p className="figma-body-text">
                {isVi
                  ? 'Khoá học được thiết kế chuyên sâu giúp học viên làm chủ cấu trúc luận điểm, mở rộng tài nguyên từ vựng chuẩn học thuật và xây dựng tính liên kết mạch lạc (Coherence & Cohesion). Giáo trình tích hợp hệ thống trí tuệ nhân tạo phát hiện lỗi sai tức thì, chấm điểm theo tiêu chí CEFR/IELTS.'
                  : 'Vue (pronounced /vjuː/, like view) is a progressive framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable. The core library is focused on the view layer only, and is easy to pick up and integrate with other libraries or existing projects.'}
              </p>
              <p className="figma-body-text">
                {isVi
                  ? 'Mỗi chương học bao gồm video giảng dạy từ giảng viên bản ngữ, bộ câu hỏi tương tác phản xạ và bài viết luận 60-100 từ có chuyên gia AI đồng hành phản hồi chi tiết.'
                  : 'On the other hand, Vue is also perfectly capable of powering sophisticated Single-Page Applications when used in combination with modern tooling and supporting libraries.'}
              </p>
            </div>
          )}

          {/* ── TAB 3: STUDENT REVIEWS (Figma Frame 518:5910) ── */}
          {contentTab === 'reviews' && (
            <div className="figma-reviews-body animate-fade-in">
              <h3 className="figma-section-title">{isVi ? 'Nhận Xét Của Học Viên' : 'Review'}</h3>

              <div className="figma-reviews-list">
                {FIGMA_STUDENT_REVIEWS.map((rev) => (
                  <div key={rev.id} className="figma-review-row">
                    <img src={rev.avatar} alt={rev.name} className="figma-reviewer-avatar" />
                    <div className="figma-reviewer-body">
                      <div className="figma-reviewer-head">
                        <strong className="figma-reviewer-name">{rev.name}</strong>
                        <span className="figma-review-date">{rev.date}</span>
                      </div>
                      <div className="figma-review-stars">{'★'.repeat(rev.rating)}</div>
                      <p className="figma-review-text">{rev.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="figma-load-more-center">
                <Button variant="outline" size="md" className="figma-pill-btn">
                  {isVi ? 'Xem thêm nhận xét' : 'Load more review'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (32% - Curriculum Accordion & Webinar) ── */}
        <aside className="figma-video-right">
          {/* Chapter 1: Course Overview */}
          <div className="figma-curriculum-accordion">
            <button
              type="button"
              className="figma-accordion-header"
              onClick={() => setExpandedChapter(expandedChapter === 'ch1' ? '' : 'ch1')}
            >
              <div>
                <strong>Chapter 1: Course Overview</strong>
                <span className="figma-accordion-meta">1/12 Videos • 28m</span>
              </div>
              <span className="material-symbols-outlined figma-accordion-arrow">
                {expandedChapter === 'ch1' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedChapter === 'ch1' && (
              <div className="figma-accordion-content animate-fade-in">
                <div className="figma-lesson-item figma-lesson-item--done">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Welcome & Syllabus</span>
                  <span className="figma-lesson-dur">5m</span>
                  <span className="figma-badge-completed">Completed</span>
                </div>
                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Setting Up Your LexiGrow Workspace</span>
                  <span className="figma-lesson-dur">12m</span>
                </div>
              </div>
            )}
          </div>

          {/* Chapter 2: Curriculum (Active Chapter matching Figma) */}
          <div className="figma-curriculum-accordion figma-curriculum-accordion--active">
            <button
              type="button"
              className="figma-accordion-header"
              onClick={() => setExpandedChapter(expandedChapter === 'ch2' ? '' : 'ch2')}
            >
              <div>
                <strong>Chapter 2: Curriculum</strong>
                <span className="figma-accordion-meta">1/12 Videos • 1h 28m</span>
              </div>
              <span className="material-symbols-outlined figma-accordion-arrow">
                {expandedChapter === 'ch2' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedChapter === 'ch2' && (
              <div className="figma-accordion-content animate-fade-in">
                <div
                  className="figma-lesson-item figma-lesson-item--done"
                  onClick={() => setCurrentStep('lesson')}
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Installing Vue JS</span>
                  <span className="figma-lesson-dur">10m</span>
                  <span className="figma-badge-completed">Completed</span>
                </div>

                <div
                  className="figma-lesson-item figma-lesson-item--playing"
                  onClick={() => setCurrentStep('writing')}
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Understand Vue Components</span>
                  <span className="figma-lesson-dur">59m</span>
                  <span className="figma-badge-playing">Playing</span>
                </div>

                <div className="figma-lesson-item" onClick={() => setCurrentStep('practice')}>
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Vue Templating</span>
                  <span className="figma-lesson-dur">12m</span>
                </div>

                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Vue Forms</span>
                  <span className="figma-lesson-dur">23m</span>
                </div>

                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Vue Styling</span>
                  <span className="figma-lesson-dur">15m</span>
                </div>

                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Vue Routing</span>
                  <span className="figma-lesson-dur">1h 30m</span>
                </div>

                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Vue Animation</span>
                  <span className="figma-lesson-dur">1h 10m</span>
                </div>
              </div>
            )}
          </div>

          {/* Chapter 3: Components */}
          <div className="figma-curriculum-accordion">
            <button
              type="button"
              className="figma-accordion-header"
              onClick={() => setExpandedChapter(expandedChapter === 'ch3' ? '' : 'ch3')}
            >
              <div>
                <strong>Chapter 3: Components</strong>
                <span className="figma-accordion-meta">1/12 Videos • 1h 28m</span>
              </div>
              <span className="material-symbols-outlined figma-accordion-arrow">
                {expandedChapter === 'ch3' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedChapter === 'ch3' && (
              <div className="figma-accordion-content animate-fade-in">
                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Component Communication & Props</span>
                  <span className="figma-lesson-dur">24m</span>
                </div>
                <div className="figma-lesson-item">
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>State Management with Pinia</span>
                  <span className="figma-lesson-dur">38m</span>
                </div>
              </div>
            )}
          </div>

          {/* Featured Webinar Card (Figma Frame 518:5910) */}
          <div className="figma-webinar-card">
            <img
              src="/assets/editorial/webinar-masterclass.png"
              alt="Featured Masterclass"
              className="figma-webinar-img"
            />
            <div className="figma-webinar-overlay">
              <span className="figma-webinar-badge">WEBINAR</span>
              <div className="figma-webinar-speaker">Ana Kursova</div>
              <h3 className="figma-webinar-title">
                Masterclass in Design Thinking, Innovation & Creativity
              </h3>
              <Button
                variant="primary"
                size="sm"
                className="figma-pill-cta figma-webinar-btn"
                onClick={() => navigate('/student/explore')}
              >
                {isVi ? 'Đăng ký tham gia' : 'Register Free'}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── 3. BOTTOM NEWSLETTER DISCOUNT CTA ── */}
      <section className="figma-newsletter-banner">
        <div className="figma-newsletter-banner__left">
          <h2 className="figma-newsletter-banner__title">
            {isVi ? 'Tham gia và nhận ưu đãi đặc biệt' : 'Join and get amazing discount'}
          </h2>
          <p className="figma-newsletter-banner__subtitle">
            {isVi
              ? 'Tận hưởng khoá học với giao diện tối ưu trên mọi thiết bị di động & máy tính.'
              : 'With our responsive themes and mobile and desktop apps.'}
          </p>
        </div>

        <form
          className="figma-newsletter-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (newsletterEmail.trim()) setNewsletterDone(true)
          }}
        >
          {newsletterDone ? (
            <div className="figma-newsletter-thanks">
              <span className="material-symbols-outlined">check_circle</span>
              <span>{isVi ? 'Đã đăng ký thành công!' : 'Subscribed successfully!'}</span>
            </div>
          ) : (
            <div className="figma-newsletter-input-group">
              <input
                type="email"
                placeholder={isVi ? 'Nhập email của bạn' : 'Email Address'}
                className="figma-newsletter-input"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit" className="figma-newsletter-btn">
                {isVi ? 'Đăng ký' : 'Subscribe'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
