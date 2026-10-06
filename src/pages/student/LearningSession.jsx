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
  }
}

export default function LearningSession() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const adaptive = searchParams.get('adaptive') === 'true'
  const setSlug = searchParams.get('set') || 'daily-life'

  const [session, setSession] = useState(null)
  const [currentStep, setCurrentStep] = useState('lesson') // 'lesson' | 'practice' | 'writing' | 'feedback' | 'revision' | 'completed'
  const [learningSet, setLearningSet] = useState(defaultLearningSets[setSlug] || defaultLearningSets['daily-life'])

  // Writing state
  const [essayContent, setEssayContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
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
        // Try calling backend API
        const res = await api.post('/sessions/start', adaptive ? { adaptive: true } : { learningSetSlug: setSlug })
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
          } else if (payload.targetWords?.length) {
            const mappedWords = payload.targetWords.map((w, idx) => ({
              ...w,
              _id: w.wordId || w._id || `w_${w.word}_${idx}`,
              meaningVi: w.definitionVi || w.definition || w.meaningVi || '',
              exampleSentence: w.exampleSentence || w.exampleSentences?.[0] || '',
              exampleTranslation: w.exampleTranslation || '',
            }))
            setLearningSet({
              title: 'Adaptive Learning Session',
              level: payload.level || 'B1',
              promptTopic: payload.snapshot?.rationale || 'Write about your learning topic.',
              words: mappedWords,
            })
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
    if (!hasServerSession) {
      setDraftSaveState('local')
      return Promise.resolve(null)
    }

    const save = async () => {
      setDraftSaveState('saving')
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
    }
    const operation = draftSaveQueue.current.then(save, save)
    draftSaveQueue.current = operation.catch(() => {})
    return operation
  }, [draftStorageKey, hasServerSession, session])

  useEffect(() => {
    if (!session || currentStep !== 'writing' || (!essayContent && !session.originalEssay)) return
    const timeout = setTimeout(() => {
      persistDraft(essayContent).catch((err) => {
        setDraftSaveState('error')
        console.error('Learning-session draft autosave failed:', err)
      })
    }, 700)
    return () => clearTimeout(timeout)
  }, [session, currentStep, essayContent, persistDraft])

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

      // First score the session's target vocabulary.
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
      setCurrentStep('feedback')
    } catch (err) {
      setSubmitError(err.message || 'The AI review could not be submitted. Your draft is still saved; please retry.')
    } finally {
      setAnalyzing(false)
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

          {/* Prompt & Editor Card */}
          <div className="writing-card card-base">
            <div className="writing-card__prompt">
              <div className="writing-card__prompt-badge">
                <span className="material-symbols-outlined">lightbulb</span>
                Writing Prompt
              </div>
              <p className="writing-card__prompt-text">{learningSet.promptTopic}</p>
            </div>

            {/* Textarea Workspace */}
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
                  {draftSaveState === 'saving' ? 'Saving draft…' : draftSaveState === 'saved' ? 'Draft saved to your account' : draftSaveState === 'local' ? 'Draft saved in this browser; reconnect to sync it to your account.' : draftSaveState === 'unsaved' ? 'Draft changes are being saved…' : 'Could not sync the draft yet. A local copy is kept in this browser.'}
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
      )}

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
          onClose={() => navigate('/student/dashboard')}
        />
      )}
    </div>
  )
}
