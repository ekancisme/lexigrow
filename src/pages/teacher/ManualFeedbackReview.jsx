import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import './ManualFeedbackReview.css'
import EssayDiscussion from '../../components/common/EssayDiscussion.jsx'

export default function ManualFeedbackReview() {
  const navigate = useNavigate()
  const { id: essayId } = useParams()

  const userStr = localStorage.getItem('lexigrow_user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const currentUserId = currentUser?._id || currentUser?.id

  const [essay, setEssay] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [feedbackId, setFeedbackId] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [scores, setScores] = useState({ grammar: 8, vocabulary: 7, coherence: 7, complexity: 8 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadFeedbackData() {
      try {
        const essayRes = await api.get(`/essays/${essayId}`)
        setEssay(essayRes.data)

        // Try to load AI analysis if available
        try {
          const aiRes = await api.get(`/essays/${essayId}/analysis`)
          if (aiRes.data) {
            setAiAnalysis(aiRes.data)
            // If AI scores exist and no teacher scores set yet, prefill scores
            if (aiRes.data.scores) {
              setScores(prev => ({
                grammar: aiRes.data.scores.grammar || prev.grammar,
                vocabulary: aiRes.data.scores.vocabulary || prev.vocabulary,
                coherence: aiRes.data.scores.coherence || prev.coherence,
                complexity: aiRes.data.scores.complexity || prev.complexity,
              }))
            }
          }
        } catch (aiErr) {
          console.log('No AI analysis for this essay yet')
        }

        // Attempt to load existing teacher manual feedback
        try {
          const fbRes = await api.get(`/feedback/essay/${essayId}`)
          if (fbRes.data) {
            setFeedbackId(fbRes.data._id)
            setFeedbackText(fbRes.data.feedbackText || '')
            if (fbRes.data.scores) {
              setScores({
                grammar: fbRes.data.scores.grammar || 8,
                vocabulary: fbRes.data.scores.vocabulary || 7,
                coherence: fbRes.data.scores.coherence || 7,
                complexity: fbRes.data.scores.complexity || 8,
              })
            }
          }
        } catch (err) {
          if (err.status !== 404) {
            console.error('Error loading feedback:', err)
          }
        }
      } catch (err) {
        console.error('Error loading essay detail:', err)
      } finally {
        setLoading(false)
      }
    }
    loadFeedbackData()
  }, [essayId])

  async function handleSaveDraft() {
    setSaving(true)
    try {
      if (feedbackId) {
        // Update existing feedback
        const res = await api.put(`/feedback/${feedbackId}`, {
          scores,
          feedbackText,
        })
        alert('Draft saved successfully!')
      } else {
        // Create new feedback
        const res = await api.post(`/feedback/${essayId}`, {
          scores,
          feedbackText,
        })
        setFeedbackId(res.data._id)
        alert('Draft feedback created!')
      }
    } catch (err) {
      alert('Error saving feedback draft: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitFeedback() {
    if (!feedbackText.trim()) {
      alert('Please provide some written feedback.')
      return
    }
    setSaving(true)
    try {
      let currentFbId = feedbackId
      if (!currentFbId) {
        const res = await api.post(`/feedback/${essayId}`, {
          scores,
          feedbackText,
        })
        currentFbId = res.data._id
        setFeedbackId(currentFbId)
      } else {
        await api.put(`/feedback/${currentFbId}`, {
          scores,
          feedbackText,
        })
      }

      // Submit feedback
      await api.patch(`/feedback/${currentFbId}/submit`)

      // Add Written Feedback directly to Essay Discussion & Revisions
      try {
        await api.post(`/comments/essay/${essayId}`, {
          content: feedbackText.trim()
        })
      } catch (commentErr) {
        console.error('Failed to post feedback comment to discussion:', commentErr)
      }

      alert('Feedback submitted and added to Essay Discussion!')
      navigate(-1)
    } catch (err) {
      alert('Error submitting feedback: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestRevision() {
    if (!feedbackText.trim()) {
      alert('Please provide some written feedback explaining why revision is requested.')
      return
    }
    setSaving(true)
    try {
      let currentFbId = feedbackId
      if (!currentFbId) {
        const res = await api.post(`/feedback/${essayId}`, {
          scores,
          feedbackText,
        })
        currentFbId = res.data._id
        setFeedbackId(currentFbId)
      } else {
        await api.put(`/feedback/${currentFbId}`, {
          scores,
          feedbackText,
        })
      }

      // Mark the essay as needs_revision
      await api.patch(`/essays/${essayId}/request-revision`)

      // Add Revision Request directly to Essay Discussion & Revisions
      try {
        await api.post(`/comments/essay/${essayId}`, {
          content: `Revision Requested: ${feedbackText.trim()}`
        })
      } catch (commentErr) {
        console.error('Failed to post revision comment to discussion:', commentErr)
      }

      alert('Revision requested and added to Essay Discussion!')
      navigate(-1)
    } catch (err) {
      alert('Error requesting revision: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="manual-feedback" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="manual-feedback">
      <button className="manual-feedback__back" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined">arrow_back</span> Back
      </button>
      <section className="manual-feedback__header">
        <h2 className="text-headline-lg">Manual Feedback Review</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
          Provide detailed feedback for {essay?.student?.name || 'Student'}'s essay
        </p>
      </section>

      <div className="manual-feedback__layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="manual-feedback__essay card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 8 }}>{essay?.title}</h3>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 16 }}>
              Submitted {new Date(essay?.submittedAt || essay?.createdAt).toLocaleDateString()} • {essay?.wordCount || 0} words
            </p>
            <div className="manual-feedback__essay-text text-body-md" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: essay?.content || '' }} />
          </div>

          {/* AI Analysis Result Card */}
          {aiAnalysis && (
            <div className="card-base" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 className="text-title-md" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
                  <span className="material-symbols-outlined">smart_toy</span>
                  AI Analysis Summary
                </h4>
                <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(26,115,232,0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 999 }}>
                  AI Score: {aiAnalysis.overallScore || 'N/A'}/10
                </span>
              </div>

              {aiAnalysis.promptUsed?.name && (
                <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 12 }}>
                  🎯 Evaluated with System Prompt: <strong>{aiAnalysis.promptUsed.name}</strong>
                </p>
              )}

              {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <strong className="text-label-sm" style={{ color: 'var(--color-on-surface)' }}>AI Key Suggestions:</strong>
                  {aiAnalysis.suggestions.slice(0, 3).map((sug, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}>
                      • {sug.title || sug.text || (typeof sug === 'string' ? sug : JSON.stringify(sug))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="manual-feedback__panel">
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Score Assessment</h3>
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="manual-feedback__score-row">
                <label className="text-label-md" style={{ textTransform: 'capitalize' }}>{key}</label>
                <div className="manual-feedback__score-control">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={val}
                    onChange={e => setScores({ ...scores, [key]: Number(e.target.value) })}
                    className="manual-feedback__slider"
                  />
                  <span className="text-data-mono">{val}/10</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Written Feedback</h3>
            <textarea
              className="manual-feedback__textarea"
              rows={8}
              placeholder="Write your detailed feedback here..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="manual-feedback__save-btn" onClick={handleSaveDraft} disabled={saving}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button className="manual-feedback__submit-btn" onClick={handleSubmitFeedback} disabled={saving}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                {saving ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button 
                className="manual-feedback__revision-btn" 
                onClick={handleRequestRevision} 
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  color: '#f59e0b',
                  fontSize: 'var(--text-label-md-size)',
                  fontWeight: 'var(--text-label-md-weight)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.15)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment_return</span>
                Request Revision
              </button>
            </div>
          </div>
        </div>
      </div>

      {essayId && (
        <EssayDiscussion essayId={essayId} currentUserId={currentUserId} />
      )}
    </div>
  )
}
