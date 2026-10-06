import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { isValidLearningEssayWordCount } from '../../utils/learningEssay.js'
import WordLesson from '../../components/learning/WordLesson'
import PracticeStep from '../../components/learning/PracticeStep'
import RevisionComparison from '../../components/learning/RevisionComparison'
import SessionCompletionModal from '../../components/learning/SessionCompletionModal'
import './LearningSession.css'

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
  const [fullEssayAnalysis, setFullEssayAnalysis] = useState(null)
  const [reviewEssayId, setReviewEssayId] = useState('')
  const [fullAnalysisLoading, setFullAnalysisLoading] = useState(false)
  const [fullAnalysisError, setFullAnalysisError] = useState('')
  const [usedHeuristicFallback, setUsedHeuristicFallback] = useState(false)
  const [originalDraft, setOriginalDraft] = useState('')
  const [activeFeedbackWord, setActiveFeedbackWord] = useState(null)

  // Initialize Session
  useEffect(() => {
    async function initSession() {
      try {
        // Try calling backend API
        const res = await api.post('/sessions/start', adaptive ? { adaptive: true } : { learningSetSlug: setSlug })
        const payload = res?.data || res
        if (payload) {
          setSession(payload)
          if (payload.currentStep) setCurrentStep(payload.currentStep)
          if (payload.learningSet?.words) {
            setLearningSet(payload.learningSet)
          } else if (payload.targetWords?.length) {
            setLearningSet({
              title: 'Adaptive Learning Session',
              level: payload.level || 'B1',
              promptTopic: payload.snapshot?.rationale || 'Write about your learning topic.',
              words: payload.targetWords,
            })
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
      }
    }
    initSession()
  }, [adaptive, setSlug])

  const words = learningSet.words || []

  // Check word usage dynamically during typing
  const wordStatusMap = words.reduce((acc, w) => {
    const regex = new RegExp(`\\b${w.word}\\b|\\b${w.word}s?\\b|\\b${w.word}ed\\b|\\b${w.word}ing\\b`, 'i')
    acc[w.word] = regex.test(essayContent)
    return acc
  }, {})

  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).filter(Boolean).length : 0

  const renderEssayWithTargetHighlights = () => {
    const targetWords = words.map(item => item.word).filter(Boolean)
    if (!targetWords.length) return essayContent
    const escapedTargets = targetWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const matcher = new RegExp(`\\b(${escapedTargets.join('|')})\\b`, 'gi')
    return essayContent.split(matcher).map((part, index) => (
      targetWords.some(word => word.toLowerCase() === part.toLowerCase())
        ? <mark key={index} style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: 4, padding: '0 2px' }}>{part}</mark>
        : part
    ))
  }

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
  const loadFullEssayAnalysis = async (essayId) => {
    setFullAnalysisLoading(true)
    setFullAnalysisError('')
    try {
      const res = await api.post(`/essays/${essayId}/reanalyze`, undefined, { timeoutMs: 45000 })
      if (!res?.data) throw new Error('The full essay review returned no analysis.')
      setFullEssayAnalysis(res.data)
    } catch (err) {
      setFullAnalysisError(err.message || 'Unable to load the full essay review.')
    } finally {
      setFullAnalysisLoading(false)
    }
  }

  const handleSubmitWriting = async () => {
    if (!isValidLearningEssayWordCount(wordCount)) {
      alert('Please write 60–100 words before submitting for AI analysis.')
      return
    }

    setAnalyzing(true)
    setFullEssayAnalysis(null)
    setReviewEssayId('')
    setFullAnalysisError('')
    setUsedHeuristicFallback(false)
    try {
      // First score the session's target vocabulary.
      const res = await api.post('/essays/submit-revision', {
        sessionId: session?._id,
        content: essayContent,
        targetWords: words.map(w => w.word)
      })

      const revision = res?.data
      if (revision?.analysis) {
        setAnalysisResult(revision.analysis)
        const essayId = typeof revision.originalEssay === 'object'
          ? revision.originalEssay?._id
          : revision.originalEssay
        if (essayId) {
          setReviewEssayId(String(essayId))
          // Continue to feedback immediately while the comprehensive review
          // runs; the detailed report is persisted for the standalone page.
          void loadFullEssayAnalysis(String(essayId))
        } else {
          setFullAnalysisError('The session response did not include its linked essay ID.')
        }
      } else {
        throw new Error('No structured analysis')
      }
    } catch (err) {
      // Structured heuristic analysis fallback
      setUsedHeuristicFallback(true)
      setFullAnalysisError(err.message || 'The vocabulary analysis request failed.')
      const targetResults = words.map(w => {
        const found = wordStatusMap[w.word]
        return {
          word: w.word,
          found: !!found,
          matchedText: found ? w.word : null,
          status: found ? 'correct' : 'not_used',
          issueType: null,
          explanationVi: found
            ? `Accurately applied "${w.word}" in context.`
            : `Word "${w.word}" was not found. Try including a sentence with this word.`
        }
      })

      setAnalysisResult({
        summary: `Cohesive writing (${wordCount} words), you successfully applied ${Object.values(wordStatusMap).filter(Boolean).length}/${words.length} target words.`,
        strengths: [
          'Clear sentence structure with good coherence to the topic.',
          'Accurate and natural baseline grammatical flow.'
        ],
        priorities: [
          Object.values(wordStatusMap).some(v => !v)
            ? 'Incorporate remaining target words to complete the learning loop.'
            : 'Try combining higher-level collocations to enrich expression.'
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
              <textarea
                className="writing-card__textarea"
                placeholder="Start writing your paragraph in English here... (e.g. Every morning, my daily routine starts at 6:30 AM...)"
                value={essayContent}
                onChange={e => setEssayContent(e.target.value)}
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
      {currentStep === 'feedback' && analysisResult && (
        <div className="feedback-flow animate-fade-in">
          {usedHeuristicFallback && (
            <div className="card-base" role="status" style={{ marginBottom: 16, border: '1px solid var(--color-error)' }}>
              The AI vocabulary review could not be loaded. The target word statuses below are a local fallback, not an AI assessment.
            </div>
          )}

          {/* Target Words Heatmap / Summary */}
          <div className="feedback-heatmap card-base">
            <h3 className="feedback-heatmap__title">
              <span className="material-symbols-outlined">analytics</span>
              Target Vocabulary Application (Rubric Check)
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

          {/* AI Comprehensive Insight */}
          <div className="feedback-insights card-base">
            <div className="feedback-insights__summary">
              <div className="feedback-insights__header">
                <span className="material-symbols-outlined">psychology</span>
                <h4>Comprehensive AI Evaluation</h4>
              </div>
              <p className="feedback-insights__summary-text">{analysisResult.summary}</p>
            </div>

            <div className="feedback-insights__cols">
              {/* Strengths */}
              <div className="feedback-insights__col feedback-insights__col--strengths">
                <h5>
                  <span className="material-symbols-outlined">thumb_up</span> Strengths
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
                  <span className="material-symbols-outlined">priority_high</span> Key Priorities for Improvement
                </h5>
                <ul>
                  {analysisResult.priorities?.map((pr, i) => (
                    <li key={i}>{pr}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="feedback-insights__actions" style={{ flexWrap: 'wrap', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => setCurrentStep('writing')}
              >
                Edit Writing
              </button>

              <button
                className="btn-primary feedback-insights__btn-revise"
                onClick={handleStartRevision}
              >
                <span className="material-symbols-outlined">auto_fix_high</span>
                Revise Now (Draft 2)
              </button>

              <a
                href="#full-essay-review-section"
                className="btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('full-essay-review-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <span className="material-symbols-outlined">visibility</span>
                View Detailed Review Below
              </a>

              {reviewEssayId && (
                <button
                  className="btn-outline"
                  onClick={() => navigate(`/student/feedback?id=${reviewEssayId}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  Open Full Feedback Page
                </button>
              )}

              <button
                className="btn-outline"
                onClick={() => handleStepChange('completed')}
              >
                Complete Session
              </button>
            </div>
          </div>

          <section id="full-essay-review-section" className="card-base" style={{ marginTop: 24, border: '2px solid var(--color-primary-container)' }} aria-labelledby="full-essay-review-title">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>psychology</span>
                  <h3 id="full-essay-review-title" className="text-title-lg" style={{ margin: 0 }}>Detailed Essay Review & AI Scoring</h3>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)', margin: '4px 0 0' }}>
                  Full essay scores, grammatical feedback with quoted citations, sentence structure, and repeated-word suggestions.
                </p>
              </div>
              {reviewEssayId && (
                <button className="btn-primary" onClick={() => navigate(`/student/feedback?id=${reviewEssayId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined">open_in_new</span>
                  Open Full Feedback Page
                </button>
              )}
            </div>

            <div style={{ margin: '12px 0 20px', padding: 16, borderRadius: 12, background: 'var(--color-surface-variant)', whiteSpace: 'pre-wrap' }}>
              <strong>Your submitted writing</strong>
              <p style={{ marginBottom: 0 }}>{renderEssayWithTargetHighlights()}</p>
            </div>

            {fullAnalysisLoading && <p role="status">Analyzing the full essay…</p>}
            {fullAnalysisError && (
              <div role="alert" style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface-variant)', marginBottom: 16 }}>
                <p style={{ marginTop: 0 }}>{fullAnalysisError}</p>
                {reviewEssayId && (
                  <button className="btn-secondary" onClick={() => loadFullEssayAnalysis(reviewEssayId)} disabled={fullAnalysisLoading}>
                    Retry full essay analysis
                  </button>
                )}
              </div>
            )}

            {fullEssayAnalysis && (
              <>
                {fullEssayAnalysis.analysisMeta?.isFallback && (
                  <p role="status">The full review used a fallback analysis because the configured AI provider was unavailable.</p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Overall score', value: fullEssayAnalysis.overallScore, max: 10 },
                    { label: 'Grammar accuracy', value: fullEssayAnalysis.scores?.grammarAccuracy, max: 10 },
                    { label: 'Vocabulary diversity', value: fullEssayAnalysis.scores?.vocabularyDiversity, max: 1 },
                    { label: 'Coherence', value: fullEssayAnalysis.scores?.coherence, max: 10 },
                    { label: 'Complexity', value: fullEssayAnalysis.scores?.complexityIndex, max: 10 },
                  ].map(score => (
                    <div key={score.label} className="card-base" style={{ padding: 14 }}>
                      <span className="text-label-md">{score.label}</span>
                      <p className="text-headline-md" style={{ margin: '8px 0 0' }}>
                        {Number.isFinite(Number(score.value)) ? Number(score.value).toFixed(score.max === 1 ? 2 : 1) : '—'} / {score.max}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <h4>Feedback on your writing</h4>
                    {fullEssayAnalysis.suggestions?.length ? fullEssayAnalysis.suggestions.map((suggestion, index) => (
                      <article key={`${suggestion.type}-${index}`} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'var(--color-surface-variant)' }}>
                        <strong>{suggestion.type === 'strength' ? 'Strength' : 'Improvement'}</strong>
                        <p>{suggestion.text}</p>
                        {suggestion.quote && <blockquote style={{ margin: '8px 0', paddingLeft: 10, borderLeft: '3px solid var(--color-primary)' }}>“{suggestion.quote}”</blockquote>}
                        {suggestion.suggestedRevision && <p><strong>Suggested sentence:</strong> {suggestion.suggestedRevision}</p>}
                      </article>
                    )) : <p>No sentence-level feedback was returned for this essay.</p>}
                  </div>

                  <div>
                    <h4>Sentence structure</h4>
                    <p>Passive voice: {fullEssayAnalysis.nlpStats?.passiveVoiceCount ?? '—'}</p>
                    <p>Subordinate clauses: {fullEssayAnalysis.nlpStats?.subordinateClausesCount ?? '—'}</p>
                    <h4>Try these in your next essay</h4>
                    <p><strong>Transitions:</strong> {fullEssayAnalysis.nextEssaySuggestions?.transitionWords?.join(', ') || '—'}</p>
                    <p><strong>Sentence structures:</strong> {fullEssayAnalysis.nextEssaySuggestions?.sentenceStructures?.join(', ') || '—'}</p>
                    {fullEssayAnalysis.nextEssaySuggestions?.generalTips && <p>{fullEssayAnalysis.nextEssaySuggestions.generalTips}</p>}
                  </div>
                </div>

                {fullEssayAnalysis.nlpStats?.repeatedWords?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4>Repeated words and alternatives</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      {fullEssayAnalysis.nlpStats.repeatedWords.map(item => (
                        <div key={item.word} className="card-base" style={{ padding: 12 }}>
                          <strong>{item.word}</strong> <span>({item.count} uses)</span>
                          <p style={{ marginBottom: 0 }}>{(item.suggestions || item.synonyms || []).join(', ') || 'No alternatives returned.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
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
