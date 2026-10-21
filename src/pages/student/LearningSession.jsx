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

// Recommended transition words for students
const TRANSITION_CONNECTORS = [
  { text: 'Furthermore,', label: 'Furthermore (Hơn nữa)' },
  { text: 'Moreover,', label: 'Moreover (Ngoài ra)' },
  { text: 'However,', label: 'However (Tuy nhiên)' },
  { text: 'In addition,', label: 'In addition (Thêm vào đó)' },
  { text: 'Therefore,', label: 'Therefore (Vì vậy)' },
  { text: 'Consequently,', label: 'Consequently (Hệ quả là)' },
  { text: 'For example,', label: 'For example (Ví dụ)' },
  { text: 'In contrast,', label: 'In contrast (Trái lại)' }
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
  const paramStep = searchParams.get('step')
  const [currentStep, setCurrentStep] = useState(paramStep || 'lesson') // 'lesson' | 'practice' | 'writing' | 'feedback' | 'revision' | 'completed'
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
  const activeRequestIdRef = useRef(null)
  const lastSubmittedContentRef = useRef(null)
  const textareaRef = useRef(null)

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
          if (payload.currentStep && !paramStep) setCurrentStep(payload.currentStep)

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

  const usedWordsCount = words.filter((w) => wordStatusMap[w.word]).length
  const usedRatio = words.length > 0 ? Math.round((usedWordsCount / words.length) * 100) : 0

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
    setCurrentStep(nextStep)
    try {
      if (hasServerSession) {
        await api.put(`/sessions/${session._id}/step`, { currentStep: nextStep })
      }
      if (nextStep === 'completed') {
        invalidateLearningPathRecommendationCache(api.getUser()?._id)
      }
      return true
    } catch (e) {
      console.warn('Could not save learning-session step on server:', e)
      return false
    }
  }

  const handleSubmitWriting = async () => {
    if (!isValidLearningEssayWordCount(wordCount)) {
      alert(t('learning.wordCountValidation', 'Bài viết cần có từ 60 đến 100 từ.'))
      return
    }
    if (!hasServerSession) {
      setSubmitError(t('learning.sessionOffline', 'Phiên học chưa được đồng bộ với máy chủ. Vui lòng tải lại trang.'))
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

  // Insert helper for target words & connectors
  const insertTextIntoEssay = (textToInsert) => {
    if (!textareaRef.current) {
      setEssayContent((prev) => (prev ? `${prev} ${textToInsert}` : textToInsert))
      return
    }
    const el = textareaRef.current
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const prev = essayContent || ''
    const spaceBefore = start > 0 && prev[start - 1] !== ' ' && prev[start - 1] !== '\n' ? ' ' : ''
    const spaceAfter = end < prev.length && prev[end] !== ' ' && prev[end] !== '\n' ? ' ' : ' '
    const next = prev.slice(0, start) + spaceBefore + textToInsert + spaceAfter + prev.slice(end)
    setEssayContent(next)
    setDraftSaveState('unsaved')
    setTimeout(() => {
      el.focus()
      const newPos = start + spaceBefore.length + textToInsert.length + spaceAfter.length
      el.setSelectionRange(newPos, newPos)
    }, 10)
  }

  return (
    <div className="writing-workspace-page animate-fade-in">
      {/* ── 1. TOP HEADER & BREADCRUMB ── */}
      <header className="writing-workspace-header">
        <nav className="writing-workspace-breadcrumb" aria-label="Breadcrumb">
          <Link to="/student/dashboard" className="writing-breadcrumb-link">
            <span className="material-symbols-outlined writing-breadcrumb-home">home</span>
            <span>{isVi ? 'Trang chủ' : 'Home'}</span>
          </Link>
          <span className="writing-breadcrumb-sep">/</span>
          <Link to="/student/explore" className="writing-breadcrumb-link">
            {isVi ? 'Thư viện chủ đề' : 'Explore'}
          </Link>
          <span className="writing-breadcrumb-sep">/</span>
          <span className="writing-breadcrumb-current">{learningSet.title}</span>
        </nav>

        <div className="writing-header-actions">
          <span className="writing-badge-level">
            <span className="material-symbols-outlined">workspace_premium</span>
            <span>CEFR {learningSet.level || 'B1'}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="writing-exit-btn"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="material-symbols-outlined">close</span>
            <span>{isVi ? 'Thoát' : 'Exit'}</span>
          </Button>
        </div>
      </header>

      {/* ── 2. TOPIC HERO BANNER ── */}
      <section className="writing-hero-banner">
        <div className="writing-hero-left">
          <div className="writing-hero-tag">
            <span className="material-symbols-outlined">edit_note</span>
            <span>{isVi ? 'Không Gian Luyện Viết Thông Minh' : 'Smart AI Writing Workspace'}</span>
          </div>
          <h1 className="writing-hero-title">{learningSet.title}</h1>
          <p className="writing-hero-desc">
            {learningSet.promptTopic || (isVi
              ? 'Luyện tập diễn đạt học thuật, ứng dụng từ vựng chuẩn ngữ cảnh và nhận phản hồi tức thì từ chuyên gia AI.'
              : 'Practice academic writing, apply target vocabulary in context, and receive instant rubric feedback from AI.')}
          </p>

          <div className="writing-hero-pills">
            <div className="writing-hero-pill">
              <span className="material-symbols-outlined">flag</span>
              <span><strong>{words.length}</strong> {isVi ? 'từ mục tiêu' : 'target words'}</span>
            </div>
            <div className="writing-hero-pill">
              <span className="material-symbols-outlined">description</span>
              <span><strong>60–100</strong> {isVi ? 'từ yêu cầu' : 'words target'}</span>
            </div>
            <div className="writing-hero-pill">
              <span className="material-symbols-outlined">psychology</span>
              <span><strong>CEFR & IELTS</strong> {isVi ? 'Rubric chuẩn' : 'Rubrics'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. STEPPER PROGRESS WIZARD ── */}
      <nav className="writing-stepper-container" aria-label="Learning Steps">
        {[
          { key: 'lesson', label: isVi ? '1. Từ vựng mục tiêu' : '1. Target Words', icon: 'school' },
          { key: 'practice', label: isVi ? '2. Luyện tập ngữ cảnh' : '2. Context Drills', icon: 'bolt' },
          { key: 'writing', label: isVi ? '3. Viết luận & Chấm AI' : '3. Paragraph Writing', icon: 'edit_document' },
          { key: 'feedback', label: isVi ? '4. Chấm điểm & Đánh giá' : '4. AI Evaluation', icon: 'auto_awesome' },
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
              className={`writing-step-pill ${isActive ? 'writing-step-pill--active' : ''} ${isDone ? 'writing-step-pill--done' : ''}`}
              onClick={() => handleStepChange(st.key)}
            >
              <span className="material-symbols-outlined writing-step-pill__icon">
                {isDone ? 'check_circle' : st.icon}
              </span>
              <span className="writing-step-pill__label">{st.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── 4. MAIN STEP CONTENT ── */}
      <main className="writing-workspace-body">
        {/* STEP 1: WORD LESSON */}
        {currentStep === 'lesson' && (
          <div className="writing-step-card animate-fade-in">
            <WordLesson
              words={words}
              topicSlug={learningSet?.slug || setSlug}
              topicTitle={learningSet?.title}
              onComplete={() => handleStepChange('practice')}
              onBack={() => navigate('/student/dashboard')}
            />
          </div>
        )}

        {/* STEP 2: PRACTICE STEP */}
        {currentStep === 'practice' && (
          <div className="writing-step-card animate-fade-in">
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
          </div>
        )}

        {/* STEP 3: SMART WRITING 2-COLUMN WORKSPACE */}
        {currentStep === 'writing' && (
          analyzing ? (
            <AIGradingProgress stage={analyzingStage} progress={analyzingProgress} />
          ) : (
            <div className="writing-layout-grid animate-fade-in">
              {/* ── LEFT COLUMN (68% - Topic Prompt & Editor) ── */}
              <div className="writing-main-column">
                {/* Topic Prompt Card */}
                <section className="writing-prompt-card">
                  <div className="writing-prompt-card__header">
                    <div className="writing-prompt-badge">
                      <span className="material-symbols-outlined">lightbulb</span>
                      <span>{isVi ? 'Đề Bài Luyện Viết' : 'Essay Prompt'}</span>
                    </div>
                    <span className="writing-prompt-badge--level">
                      {learningSet.level || 'B1'}
                    </span>
                  </div>

                  <p className="writing-prompt-text">{learningSet.promptTopic}</p>

                  <div className="writing-prompt-hint">
                    <span className="material-symbols-outlined">info</span>
                    <span>
                      {isVi
                        ? 'Hãy vận dụng các từ vựng mục tiêu vào đoạn văn (60–100 từ) một cách mạch lạc. Chuyên gia AI sẽ phân tích ngữ pháp, collocations và cho điểm ngay sau khi nộp.'
                        : 'Incorporate the target words naturally into your 60–100 word response. The AI Agent will evaluate grammar, collocations, and flow.'}
                    </span>
                  </div>
                </section>

                {/* Editor Card */}
                <section className="writing-editor-card">
                  <div className="writing-editor-card__header">
                    <div className="writing-editor-title">
                      <span className="material-symbols-outlined">ink_pen</span>
                      <span>{isVi ? 'Khu vực soạn thảo' : 'Writing Editor'}</span>
                    </div>

                    <div className="writing-editor-autosave">
                      {draftSaveState === 'saving' && (
                        <span className="writing-autosave-status writing-autosave-status--saving">
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          <span>{isVi ? 'Đang lưu bản nháp…' : 'Autosaving…'}</span>
                        </span>
                      )}
                      {draftSaveState === 'saved' && (
                        <span className="writing-autosave-status writing-autosave-status--saved">
                          <span className="material-symbols-outlined">cloud_done</span>
                          <span>{isVi ? 'Đã lưu tự động' : 'Draft saved'}</span>
                        </span>
                      )}
                      {draftSaveState === 'unsaved' && (
                        <span className="writing-autosave-status writing-autosave-status--unsaved">
                          <span className="material-symbols-outlined">cloud_sync</span>
                          <span>{isVi ? 'Có thay đổi chưa lưu' : 'Unsaved edits'}</span>
                        </span>
                      )}
                      {draftSaveState === 'error' && (
                        <span className="writing-autosave-status writing-autosave-status--error">
                          <span className="material-symbols-outlined">error</span>
                          <span>{isVi ? 'Lỗi lưu bản nháp' : 'Save error'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {submitError && (
                    <div className="writing-alert-error" role="alert">
                      <span className="material-symbols-outlined">warning</span>
                      <span>{submitError}</span>
                    </div>
                  )}

                  {stepSaveError && (
                    <div className="writing-alert-error" role="alert">
                      <span className="material-symbols-outlined">warning</span>
                      <span>{stepSaveError}</span>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    className="writing-essay-textarea"
                    placeholder={t(
                      'learning.writePlaceholder',
                      isVi
                        ? 'Viết đoạn văn của bạn tại đây (yêu cầu từ 60 đến 100 từ). Sử dụng các từ vựng mục tiêu ở cột bên phải để đạt điểm tối đa...'
                        : 'Type your paragraph here (60-100 words). Incorporate the target vocabulary on the right to achieve optimal score...'
                    )}
                    value={essayContent}
                    onChange={(e) => {
                      setEssayContent(e.target.value)
                      setSubmitError('')
                      setDraftSaveState('unsaved')
                    }}
                    rows={10}
                  />

                  {/* Editor Footer / Word Count & Actions */}
                  <div className="writing-editor-footer">
                    <div className="writing-word-counter">
                      <span className="material-symbols-outlined writing-counter-icon">
                        {wordCount >= 60 && wordCount <= 100 ? 'check_circle' : 'straighten'}
                      </span>
                      <span className="writing-counter-label">
                        {isVi ? 'Độ dài:' : 'Word count:'}
                      </span>
                      <strong
                        className={`writing-counter-number ${
                          wordCount >= 60 && wordCount <= 100
                            ? 'writing-counter-number--ideal'
                            : wordCount > 100
                              ? 'writing-counter-number--over'
                              : 'writing-counter-number--under'
                        }`}
                      >
                        {wordCount}
                      </strong>
                      <span className="writing-counter-range">/ 60–100 {isVi ? 'từ' : 'words'}</span>

                      {/* Status indicator hint */}
                      {wordCount < 60 && (
                        <span className="writing-counter-tip writing-counter-tip--under">
                          ({isVi ? `Cần thêm ít nhất ${60 - wordCount} từ` : `${60 - wordCount} more needed`})
                        </span>
                      )}
                      {wordCount >= 60 && wordCount <= 100 && (
                        <span className="writing-counter-tip writing-counter-tip--ideal">
                          ({isVi ? 'Đạt chuẩn độ dài' : 'Optimal length'})
                        </span>
                      )}
                      {wordCount > 100 && (
                        <span className="writing-counter-tip writing-counter-tip--over">
                          ({isVi ? `Vượt quá ${wordCount - 100} từ` : `${wordCount - 100} words over`})
                        </span>
                      )}
                    </div>

                    <div className="writing-editor-actions">
                      <Button
                        variant="secondary"
                        size="md"
                        className="writing-btn-back"
                        onClick={() => setCurrentStep('practice')}
                      >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span>{isVi ? 'Quay lại' : 'Back'}</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="md"
                        className="writing-btn-submit"
                        onClick={handleSubmitWriting}
                        disabled={analyzing || !isValidLearningEssayWordCount(wordCount)}
                      >
                        <span>{isVi ? 'Nộp bài & Chấm AI' : 'Submit & Grade AI'}</span>
                        <span className="material-symbols-outlined">auto_awesome</span>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>

              {/* ── RIGHT COLUMN (32% - Companion Sidebar) ── */}
              <aside className="writing-sidebar-column">
                {/* 1. Target Vocabulary Checklist Tracker */}
                <div className="writing-companion-card">
                  <div className="writing-companion-card__header">
                    <div className="writing-companion-title">
                      <span className="material-symbols-outlined">checklist</span>
                      <span>{isVi ? 'Từ vựng mục tiêu' : 'Target Vocabulary'}</span>
                    </div>
                    <span className="writing-used-badge">
                      {usedWordsCount}/{words.length} {isVi ? 'từ' : 'used'}
                    </span>
                  </div>

                  {/* Progress tracker bar */}
                  <div className="writing-words-progress">
                    <div
                      className="writing-words-progress__bar"
                      style={{ width: `${usedRatio}%` }}
                    />
                  </div>

                  <div className="writing-words-list">
                    {words.map((w) => {
                      const used = wordStatusMap[w.word]
                      return (
                        <div
                          key={w.word}
                          className={`writing-word-item ${used ? 'writing-word-item--used' : ''}`}
                        >
                          <div className="writing-word-item__top">
                            <span className="material-symbols-outlined writing-word-status-icon">
                              {used ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div className="writing-word-item__main">
                              <span className="writing-word-item__text">{w.word}</span>
                              {w.ipa && <span className="writing-word-item__ipa">{w.ipa}</span>}
                              {w.partOfSpeech && (
                                <span className="writing-word-item__pos">{w.partOfSpeech}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="writing-word-insert-btn"
                              title={isVi ? 'Chèn từ vào bài viết' : 'Insert into essay'}
                              onClick={() => insertTextIntoEssay(w.word)}
                            >
                              <span className="material-symbols-outlined">add</span>
                            </button>
                          </div>

                          <div className="writing-word-item__meaning">
                            {w.meaningVi || w.meaning}
                          </div>

                          {w.collocations?.length > 0 && (
                            <div className="writing-word-item__collocation">
                              <span className="material-symbols-outlined">link</span>
                              <span>
                                {typeof w.collocations[0] === 'string'
                                  ? w.collocations[0]
                                  : w.collocations[0]?.phrase}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Quick Transition Words Helper */}
                <div className="writing-companion-card">
                  <div className="writing-companion-card__header">
                    <div className="writing-companion-title">
                      <span className="material-symbols-outlined">conversion_path</span>
                      <span>{isVi ? 'Từ nối mạch lạc (Transitions)' : 'Transition Connectors'}</span>
                    </div>
                  </div>
                  <p className="writing-companion-hint">
                    {isVi
                      ? 'Bấm vào từ nối để tự động chèn vào vị trí con trỏ:'
                      : 'Click any connector to insert into your essay:'}
                  </p>
                  <div className="writing-connectors-grid">
                    {TRANSITION_CONNECTORS.map((c) => (
                      <button
                        key={c.text}
                        type="button"
                        className="writing-connector-chip"
                        onClick={() => insertTextIntoEssay(c.text)}
                        title={c.label}
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                        <span>{c.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. AI Rubric Guidance Card */}
                <div className="writing-companion-card writing-rubric-card">
                  <div className="writing-companion-card__header">
                    <div className="writing-companion-title">
                      <span className="material-symbols-outlined">rule</span>
                      <span>{isVi ? 'Tiêu chí chấm điểm CEFR' : 'AI Scoring Rubric'}</span>
                    </div>
                  </div>

                  <ul className="writing-rubric-list">
                    <li className="writing-rubric-item">
                      <span className="writing-rubric-dot writing-rubric-dot--mint" />
                      <div>
                        <strong>Lexical Resource:</strong>
                        <span>{isVi ? 'Sử dụng chuẩn xác từ mục tiêu và cụm collocations tự nhiên.' : 'Accurate use of target words & natural collocations.'}</span>
                      </div>
                    </li>
                    <li className="writing-rubric-item">
                      <span className="writing-rubric-dot writing-rubric-dot--yellow" />
                      <div>
                        <strong>Grammar Range:</strong>
                        <span>{isVi ? 'Đa dạng cấu trúc câu, thì động từ và hạn chế lỗi cú pháp.' : 'Sentence variety, correct tenses, and grammatical accuracy.'}</span>
                      </div>
                    </li>
                    <li className="writing-rubric-item">
                      <span className="writing-rubric-dot writing-rubric-dot--purple" />
                      <div>
                        <strong>Coherence & Cohesion:</strong>
                        <span>{isVi ? 'Liên kết câu tự nhiên bằng các từ nối logic.' : 'Clear paragraph flow using cohesive devices.'}</span>
                      </div>
                    </li>
                    <li className="writing-rubric-item">
                      <span className="writing-rubric-dot writing-rubric-dot--pink" />
                      <div>
                        <strong>Task Achievement:</strong>
                        <span>{isVi ? 'Trả lời trọn vẹn chủ đề trong phạm vi 60–100 từ.' : 'Fulfills prompt requirements within 60–100 words.'}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          )
        )}

        {/* STEP 4: AI FEEDBACK */}
        {currentStep === 'feedback' && (
          <div className="writing-feedback-area animate-fade-in">
            {analysisResult?.targetWordResults && (
              <div className="writing-heatmap-box">
                <h3 className="writing-heatmap-title">
                  <span className="material-symbols-outlined">analytics</span>
                  <span>{isVi ? 'Đánh Giá Từ Vựng Mục Tiêu' : 'Target Vocabulary Rubric'}</span>
                </h3>
                <div className="writing-heatmap-grid">
                  {analysisResult.targetWordResults.map((res) => (
                    <div
                      key={res.word}
                      className={`writing-heatmap-item ${activeFeedbackWord === res.word ? 'writing-heatmap-item--active' : ''}`}
                      onClick={() => setActiveFeedbackWord(res.word)}
                    >
                      <div className="writing-heatmap-item-top">
                        <strong>{res.word}</strong>
                        <span className={`writing-rubric-badge writing-rubric-badge--${res.status}`}>
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
          <div className="writing-step-card animate-fade-in">
            <RevisionComparison
              originalDraft={originalDraft}
              revisedDraft={essayContent}
              resolvedItems={words.filter((w) => wordStatusMap[w.word])}
              onSaveRevision={handleSaveRevision}
              onProceed={() => handleStepChange('completed')}
            />
          </div>
        )}

        {/* STEP 5: COMPLETION */}
        {currentStep === 'completed' && (
          <SessionCompletionModal
            sessionData={{ words, targetWords: words }}
            onStartNext={handleStartNextSession}
            onClose={() => navigate('/student/dashboard')}
          />
        )}
      </main>
    </div>
  )
}
