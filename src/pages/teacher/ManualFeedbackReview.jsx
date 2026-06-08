import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api.js'
import './ManualFeedbackReview.css'

export default function ManualFeedbackReview() {
  const navigate = useNavigate()
  const { id: essayId } = useParams()

  const [essay, setEssay] = useState(null)
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

        // Attempt to load existing feedback
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
          // If 404, it means no feedback created yet, which is fine
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
      alert('Feedback submitted successfully!')
      navigate(-1)
    } catch (err) {
      alert('Error submitting feedback: ' + err.message)
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
        <div className="manual-feedback__essay card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 8 }}>{essay?.title}</h3>
          <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 16 }}>
            Submitted {new Date(essay?.submittedAt || essay?.createdAt).toLocaleDateString()} • {essay?.wordCount || 0} words
          </p>
          <div className="manual-feedback__essay-text text-body-md" style={{ whiteSpace: 'pre-wrap' }}>
            {essay?.content}
          </div>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="manual-feedback__save-btn" onClick={handleSaveDraft} disabled={saving}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button className="manual-feedback__submit-btn" onClick={handleSubmitFeedback} disabled={saving}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                {saving ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
