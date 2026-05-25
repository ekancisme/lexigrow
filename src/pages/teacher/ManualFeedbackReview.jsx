import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ManualFeedbackReview.css'

export default function ManualFeedbackReview() {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState('')
  const [scores, setScores] = useState({ grammar: 8, vocabulary: 7, coherence: 7, complexity: 8 })

  return (
    <div className="manual-feedback">
      <button className="manual-feedback__back" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined">arrow_back</span> Back
      </button>
      <section className="manual-feedback__header">
        <h2 className="text-headline-lg">Manual Feedback Review</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Provide detailed feedback for Alex Rivera's essay</p>
      </section>

      <div className="manual-feedback__layout">
        <div className="manual-feedback__essay card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 8 }}>Impact of Automation in Healthcare</h3>
          <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 16 }}>Submitted Oct 22, 2023 • 1,240 words</p>
          <div className="manual-feedback__essay-text text-body-md">
            <p>The rapid advancement of automation technologies has fundamentally transformed the healthcare industry, creating unprecedented opportunities for improving patient outcomes while simultaneously raising critical questions about the role of human practitioners in an increasingly digital landscape.</p>
            <p style={{ marginTop: 16 }}>Healthcare institutions worldwide are implementing automated systems across various departments, from radiology to pharmacy management. These systems have demonstrated remarkable efficacy in reducing human error, streamlining administrative processes, and enabling more precise diagnostic procedures.</p>
            <p style={{ marginTop: 16 }}>However, the integration of automation in healthcare is not without challenges. Concerns about data privacy, algorithmic bias, and the potential displacement of healthcare workers must be carefully addressed to ensure that technological progress serves the broader goal of equitable healthcare access.</p>
          </div>
        </div>

        <div className="manual-feedback__panel">
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Score Assessment</h3>
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="manual-feedback__score-row">
                <label className="text-label-md" style={{ textTransform: 'capitalize' }}>{key}</label>
                <div className="manual-feedback__score-control">
                  <input type="range" min="1" max="10" value={val} onChange={e => setScores({ ...scores, [key]: Number(e.target.value) })} className="manual-feedback__slider" />
                  <span className="text-data-mono">{val}/10</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Written Feedback</h3>
            <textarea className="manual-feedback__textarea" rows={8} placeholder="Write your detailed feedback here..." value={feedback} onChange={e => setFeedback(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="manual-feedback__save-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Save Draft
              </button>
              <button className="manual-feedback__submit-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span> Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
