import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './AIFeedbackReview.css'

export default function AIFeedbackReview() {
  const [searchParams] = useSearchParams()
  const essayId = searchParams.get('id')
  const navigate = useNavigate()

  const [essay, setEssay] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!essayId) {
      setError('No essay selected')
      setLoading(false)
      return
    }

    let intervalId

    async function fetchAnalysis() {
      try {
        const essayRes = await api.get(`/essays/${essayId}`)
        setEssay(essayRes.data)

        if (essayRes.data.status === 'submitted') {
          // Still analyzing, keep loading and polling
          setLoading(true)
        } else {
          // Status is reviewed or draft
          const analysisRes = await api.get(`/essays/${essayId}/analysis`)
          setAnalysis(analysisRes.data)
          setLoading(false)
          if (intervalId) clearInterval(intervalId)
        }
      } catch (err) {
        console.error('Error loading feedback:', err)
        setError(err.message || 'Failed to load AI analysis')
        setLoading(false)
        if (intervalId) clearInterval(intervalId)
      }
    }

    fetchAnalysis()

    // Poll every 5 seconds if still analyzing
    intervalId = setInterval(fetchAnalysis, 5000)

    return () => clearInterval(intervalId)
  }, [essayId])

  async function handleReanalyze() {
    try {
      setLoading(true)
      await api.post(`/essays/${essayId}/reanalyze`)
      // Will auto-poll since status changes to submitted
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading && !essay) {
    return (
      <div className="ai-feedback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p className="text-body-md">Connecting to server...</p>
      </div>
    )
  }

  if (loading && essay?.status === 'submitted') {
    return (
      <div className="ai-feedback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          auto_awesome
        </span>
        <h3 className="text-title-lg">AI is reading and analyzing your writing...</h3>
        <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>This usually takes 10-15 seconds. Please wait.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-feedback" style={{ padding: 24, textAlign: 'center' }}>
        <h3 className="text-title-lg" style={{ color: 'var(--color-error)' }}>Error Loading Review</h3>
        <p className="text-body-md" style={{ margin: '16px 0' }}>{error}</p>
        <button onClick={() => navigate('/student/dashboard')} className="ai-feedback__btn-primary">Back to Dashboard</button>
      </div>
    )
  }

  const overallScore = analysis?.overallScore || 0
  const scoresList = [
    { label: 'Vocabulary Diversity (TTR)', score: analysis?.scores?.vocabularyDiversity || 0, max: 1 },
    { label: 'Grammar Accuracy', score: analysis?.scores?.grammarAccuracy || 0, max: 10 },
    { label: 'Coherence & Flow', score: analysis?.scores?.coherence || 0, max: 10 },
    { label: 'Complexity Index', score: analysis?.scores?.complexityIndex || 0, max: 10 },
  ]

  return (
    <div className="ai-feedback">
      <section className="ai-feedback__header">
        <div>
          <h2 className="text-headline-lg">AI Feedback Review</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {essay?.title} — {new Date(essay?.submittedAt || essay?.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ai-feedback__btn-outline" onClick={handleReanalyze}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            Re-analyze
          </button>
          <button className="ai-feedback__btn-primary" onClick={() => navigate(`/student/write-essay?id=${essayId}`)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
            Revise Essay
          </button>
        </div>
      </section>

      <div className="ai-feedback__layout">
        {/* Main Scores */}
        <div className="ai-feedback__main">
          {/* Overall Score */}
          <div className="ai-feedback__overall card-base">
            <div className="ai-feedback__score-ring">
              <svg width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-surface-container)" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-primary)" strokeWidth="8"
                  strokeDasharray={314} strokeDashoffset={314 - (overallScore / 10) * 314}
                  strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="ai-feedback__score-value">
                <span className="text-headline-lg">{overallScore}</span>
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>/10</span>
              </div>
            </div>
            <div>
              <h3 className="text-title-lg">Overall Score</h3>
              <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                {overallScore >= 8 ? 'Excellent Work!' : overallScore >= 6 ? 'Good job, keep it up!' : 'Keep practicing to improve.'}
              </p>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 20 }}>Detailed Analysis</h3>
            <div className="ai-feedback__scores">
              {scoresList.map((s, i) => (
                <div key={i} className="ai-feedback__score-item">
                  <div className="ai-feedback__score-label">
                    <span className="text-label-md">{s.label}</span>
                    <span className="text-data-mono">{s.score}/{s.max}</span>
                  </div>
                  <div className="ai-feedback__score-bar">
                    <div className="ai-feedback__score-fill" style={{ width: `${(s.score / s.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 20 }}>AI Suggestions</h3>
            <div className="ai-feedback__suggestions">
              {analysis?.suggestions?.map((s, i) => (
                <div key={i} className={`ai-feedback__suggestion ai-feedback__suggestion--${s.type || 'strength'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {s.type === 'strength' ? 'thumb_up' : 'lightbulb'}
                  </span>
                  <p className="text-body-md">{s.text}</p>
                </div>
              )) || <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>No suggestions generated.</p>}
            </div>
          </div>
        </div>

        {/* Side: New Words */}
        <div className="ai-feedback__side">
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', marginRight: 8 }}>auto_awesome</span>
              New Words Detected
            </h3>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 16 }}>
              {analysis?.newWordsDetected?.length || 0} new words added to your library
            </p>
            <div className="ai-feedback__words">
              {analysis?.newWordsDetected?.map((w, i) => (
                <span key={i} className="ai-feedback__word-chip">{w}</span>
              )) || <span className="text-body-md" style={{ color: 'var(--color-outline)' }}>None detected.</span>}
            </div>
          </div>

          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Writing Stats</h3>
            <div className="ai-feedback__writing-stats">
              <div className="ai-feedback__wstat">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Word Count</span>
                <span className="text-data-mono">{essay?.wordCount || 0}</span>
              </div>
              <div className="ai-feedback__wstat">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Paragraphs</span>
                <span className="text-data-mono">{essay?.paragraphCount || 0}</span>
              </div>
              <div className="ai-feedback__wstat">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Unique Words</span>
                <span className="text-data-mono">{analysis?.writingStats?.uniqueWords || 'N/A'}</span>
              </div>
              <div className="ai-feedback__wstat">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Reading Time</span>
                <span className="text-data-mono">{essay?.readingTime || 1} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
