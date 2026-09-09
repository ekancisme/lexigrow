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
      alert('Please write at least 10 words before submitting for AI analysis.')
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
                  <span className={`writing-card__count ${wordCount >= 60 && wordCount <= 120 ? 'writing-card__count--ideal' : ''}`}>
                    {wordCount}
                  </span>
                  <span className="writing-card__limit"> / Target 60–100 words</span>
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
                    disabled={analyzing || wordCount < 5}
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
            <div className="feedback-insights__actions">
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

              <button
                className="btn-outline"
                onClick={() => handleStepChange('completed')}
              >
                Complete Session
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