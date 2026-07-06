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
  const [isEssayExpanded, setIsEssayExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [addedWords, setAddedWords] = useState({})
  const [copiedSynonym, setCopiedSynonym] = useState('')

  // Portal states when no id is present in URL
  const [essayList, setEssayList] = useState([])
  const [isLoadingList, setIsLoadingList] = useState(false)

  async function handleAddWord(word) {
    if (addedWords[word] === 'added' || addedWords[word] === 'loading') return
    try {
      setAddedWords(prev => ({ ...prev, [word]: 'loading' }))
      await api.post('/vocabulary', { word })
      setAddedWords(prev => ({ ...prev, [word]: 'added' }))
    } catch (err) {
      console.error('Error adding word to study list:', err)
      if (err.message && err.message.toLowerCase().includes('already exists')) {
        setAddedWords(prev => ({ ...prev, [word]: 'added' }))
      } else {
        setAddedWords(prev => ({ ...prev, [word]: 'error' }))
      }
    }
  }

  function handleCopyEssay(e) {
    e.stopPropagation()
    if (!essay?.content) return
    navigator.clipboard.writeText(essay.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopySynonym(synonym) {
    navigator.clipboard.writeText(synonym)
    setCopiedSynonym(synonym)
    setTimeout(() => setCopiedSynonym(''), 1500)
  }

  useEffect(() => {
    if (!essayId) {
      setError('')
      setLoading(false)
      
      async function fetchEssayList() {
        try {
          setIsLoadingList(true)
          const res = await api.get('/essays')
          if (res.success) {
            // Filter only submitted/reviewed essays
            const filtered = (res.data || []).filter(e => e.status !== 'draft')
            setEssayList(filtered)
          }
        } catch (err) {
          console.error('Error fetching essays:', err)
        } finally {
          setIsLoadingList(false)
        }
      }
      fetchEssayList()
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
      setEssay(prev => prev ? { ...prev, status: 'submitted' } : null)
      setError('')
      const res = await api.post(`/essays/${essayId}/reanalyze`)
      if (res.success) {
        setAnalysis(res.data)
        const essayRes = await api.get(`/essays/${essayId}`)
        setEssay(essayRes.data)
      }
    } catch (err) {
      setError(err.message || 'Failed to reanalyze essay')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !essay && essayId) {
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

  if (!essayId) {
    return (
      <div className="ai-feedback" style={{ padding: 24 }}>
        <h2 className="text-headline-lg" style={{ marginBottom: 8 }}>AI Feedback Portal</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 24 }}>
          Select an essay below to review the AI suggestions, scores, and custom writing analytics.
        </p>

        {isLoadingList ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--color-outline)' }}>
            <span className="material-symbols-outlined animate-spin" style={{ marginRight: 8, color: 'var(--color-primary)' }}>progress_activity</span>
            <span>Loading your essays...</span>
          </div>
        ) : essayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--color-surface-container-lowest)', borderRadius: 16, border: '1px solid var(--color-outline-variant)' }} className="card-base">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-outline)', marginBottom: 16 }}>edit_note</span>
            <h3 className="text-title-lg" style={{ marginBottom: 8 }}>No Essays Submitted Yet</h3>
            <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 24, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Submit your first essay to let our AI analyze your writing patterns and provide custom vocabulary recommendations.
            </p>
            <button onClick={() => navigate('/student/write-essay')} className="ai-feedback__btn-primary">
              Write New Essay
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {essayList.map((e) => (
              <div 
                key={e._id} 
                onClick={() => navigate(`/student/feedback?id=${e._id}`)}
                className="card-base"
                style={{ 
                  padding: 20, 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, box-shadow 0.2s', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '140px'
                }}
                onMouseEnter={(el) => {
                  el.currentTarget.style.transform = 'translateY(-2px)'
                  el.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(el) => {
                  el.currentTarget.style.transform = 'translateY(0)'
                  el.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 className="text-title-md" style={{ fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textAlign: 'left', margin: 0 }}>
                      {e.title}
                    </h3>
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        textTransform: 'uppercase',
                        backgroundColor: e.status === 'reviewed' ? 'rgba(52, 168, 83, 0.1)' : 'rgba(26, 115, 232, 0.1)',
                        color: e.status === 'reviewed' ? 'var(--color-success, #34a853)' : 'var(--color-primary, #1a73e8)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {e.status}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ color: 'var(--color-outline)', marginBottom: 12, textAlign: 'left' }}>
                    Submitted on {new Date(e.submittedAt || e.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 12 }}>
                  <span className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Word Count: {e.content?.split(/\s+/).filter(Boolean).length || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    <span>View Analysis</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
    { 
      label: 'Vocabulary Diversity (TTR)', 
      score: analysis?.scores?.vocabularyDiversity || 0, 
      max: 1,
      description: 'Type-Token Ratio. The ratio of unique words to total words. Sensitive to essay length.'
    },
    { 
      label: 'Lexical Diversity (HD-D)', 
      score: analysis?.scores?.lexicalDiversityHdd || 0, 
      max: 1,
      description: 'Hypergeometric Distribution D. Measures variety by sampling 42-word segments. Highly reliable & length-independent.'
    },
    { 
      label: 'Lexical Diversity (MTLD)', 
      score: analysis?.scores?.lexicalDiversityMtld || 0, 
      max: 120,
      description: 'Measure of Textual Lexical Diversity. Calculates average word run length before TTR drops below 0.72. Target: 50+ (higher is better).'
    },
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

          {/* Original Essay Content */}
          <div className="card-base" style={{ padding: '20px 24px' }}>
            <div 
              onClick={() => setIsEssayExpanded(!isEssayExpanded)} 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>description</span>
                <h3 className="text-title-lg" style={{ margin: 0 }}>Your Written Essay</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button 
                  onClick={handleCopyEssay} 
                  title="Copy essay to clipboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-outline-variant)',
                    background: 'transparent',
                    color: copied ? 'var(--color-success)' : 'var(--color-outline)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--transition-fast)',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
                <span 
                  className="material-symbols-outlined" 
                  style={{ 
                    transform: isEssayExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform var(--transition-normal)',
                    color: 'var(--color-outline)'
                  }}
                >
                  expand_more
                </span>
              </div>
            </div>
            {isEssayExpanded && (
              <div style={{ 
                marginTop: 20, 
                maxHeight: '400px', 
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'var(--font-family)',
                  lineHeight: '1.8',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface-container-low)',
                  borderLeft: '4px solid var(--color-primary)',
                  color: 'var(--color-on-surface)',
                  fontSize: 'var(--text-body-md-size)',
                  textAlign: 'left'
                }}>
                  {essay?.content}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Scores */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 20 }}>Detailed Analysis</h3>
            <div className="ai-feedback__scores">
              {scoresList.map((s, i) => (
                <div key={i} className="ai-feedback__score-item" style={{ marginBottom: 16 }}>
                  <div className="ai-feedback__score-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                      <span className="text-label-md" style={{ fontWeight: 600 }}>{s.label}</span>
                      {s.description && (
                        <span style={{ fontSize: '11px', color: 'var(--color-outline)', fontWeight: 400, lineHeight: '1.4' }}>
                          {s.description}
                        </span>
                      )}
                    </div>
                    <span className="text-data-mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {s.max === 1 ? Number(s.score).toFixed(2) : Number(s.score).toFixed(1)}/{s.max}
                    </span>
                  </div>
                  <div className="ai-feedback__score-bar" style={{ marginTop: 8 }}>
                    <div className="ai-feedback__score-fill" style={{ width: `${Math.min(100, (s.score / s.max) * 100)}%` }} />
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

          {/* Sentence Structure & Repetitive Words Analysis */}
          {analysis?.nlpStats && (
            <div className="card-base ai-feedback__nlp-analysis" style={{ marginTop: 24 }}>
              <h3 className="text-title-lg" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>analytics</span>
                Sentence Structure & Word Repetitions
              </h3>
              
              <div className="ai-feedback__nlp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="ai-feedback__nlp-card" style={{ padding: 16, borderRadius: 12, backgroundColor: 'var(--color-surface-variant)', border: '1px solid var(--color-outline-variant)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>swap_calls</span>
                    <span className="text-label-md" style={{ fontWeight: 700 }}>Passive Voice Constructions</span>
                  </div>
                  <p className="text-headline-md" style={{ margin: 0 }}>{analysis.nlpStats.passiveVoiceCount}</p>
                  <p className="text-body-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                    {analysis.nlpStats.passiveVoiceCount > 3 ? 'Try to use active voice more often to make writing punchy.' : 'Good balance of active/passive structures.'}
                  </p>
                </div>

                <div className="ai-feedback__nlp-card" style={{ padding: 16, borderRadius: 12, backgroundColor: 'var(--color-surface-variant)', border: '1px solid var(--color-outline-variant)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)' }}>schema</span>
                    <span className="text-label-md" style={{ fontWeight: 700 }}>Subordinate Clauses</span>
                  </div>
                  <p className="text-headline-md" style={{ margin: 0 }}>{analysis.nlpStats.subordinateClausesCount}</p>
                  <p className="text-body-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                    {analysis.nlpStats.subordinateClausesCount > 0 ? 'Indicates usage of complex sentences and connectors.' : 'Try using conjunctions (because, since, although) to connect clauses.'}
                  </p>
                </div>
              </div>

              {analysis.nlpStats.repeatedWords && analysis.nlpStats.repeatedWords.length > 0 && (
                <div className="ai-feedback__repeated-words" style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: 16 }}>
                  <h4 className="text-title-md" style={{ marginBottom: 12, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined">warning</span>
                    Overused Words Alert
                  </h4>
                  <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 16 }}>
                    These words are repeated frequently. Click a suggested synonym to copy it, or click the plus icon to add it to your study list:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysis.nlpStats.repeatedWords.map((item, idx) => {
                      const sugList = item.suggestions || item.synonyms || [];
                      return (
                        <div key={idx} className="ai-feedback__repeated-word-row" style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '12px 16px', 
                          borderRadius: '12px', 
                          backgroundColor: 'var(--color-surface-container-low)', 
                          border: '1px solid var(--color-outline-variant)',
                          flexWrap: 'wrap',
                          gap: 12,
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="ai-feedback__repeated-word-badge" style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              backgroundColor: 'var(--color-error-container)', 
                              color: 'var(--color-error)', 
                              fontSize: '13px', 
                              fontWeight: 700 
                            }}>
                              <strong>{item.word}</strong>
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--color-outline)' }}>
                              repeated <strong>{item.count}</strong> times
                            </span>
                          </div>
                          
                          {sugList.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-success)' }}>trending_flat</span>
                              <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginRight: 4, fontWeight: 500 }}>Try instead:</span>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {sugList.map((sug, sIdx) => {
                                  const isCopied = copiedSynonym === sug;
                                  const status = addedWords[sug];
                                  return (
                                    <div
                                      key={sIdx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        borderRadius: '8px',
                                        backgroundColor: isCopied 
                                          ? 'var(--color-success-container)' 
                                          : status === 'added' 
                                            ? 'rgba(22, 163, 74, 0.08)' 
                                            : 'rgba(26, 115, 232, 0.05)',
                                        border: `1px solid ${
                                          isCopied 
                                            ? 'var(--color-success)' 
                                            : status === 'added'
                                              ? 'var(--color-success)'
                                              : 'rgba(26, 115, 232, 0.15)'
                                        }`,
                                        color: isCopied 
                                          ? 'var(--color-on-success-container)' 
                                          : status === 'added'
                                            ? 'var(--color-success)'
                                            : 'var(--color-primary)',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        overflow: 'hidden',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                      }}
                                    >
                                      {/* Copy Action Part */}
                                      <button
                                        onClick={() => handleCopySynonym(sug)}
                                        title="Click to copy"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          padding: '6px 10px',
                                          color: 'inherit',
                                          fontFamily: 'inherit',
                                          fontSize: 'inherit',
                                          fontWeight: 'inherit',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}
                                      >
                                        {sug}
                                        {isCopied && (
                                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                                        )}
                                      </button>

                                      {/* Separator Line */}
                                      <span style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'currentColor', opacity: 0.2 }} />

                                      {/* Add to Study List Part */}
                                      {status === 'loading' ? (
                                        <span style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }}>
                                          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 14 }}>progress_activity</span>
                                        </span>
                                      ) : status === 'added' ? (
                                        <span title="Added to vocabulary" style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', color: 'var(--color-success)' }}>
                                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                                        </span>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleAddWord(sug)
                                          }}
                                          title="Add to study list"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '6px 8px',
                                            color: 'inherit',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            opacity: 0.8,
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.opacity = 1 }}
                                          onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.8 }}
                                        >
                                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: 'var(--color-outline)' }}>
                              No recommendations available. Try reanalyzing this essay.
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
