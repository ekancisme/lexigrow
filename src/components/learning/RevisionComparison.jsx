import { useState } from 'react'
import { MAX_LEARNING_ESSAY_WORDS, MIN_LEARNING_ESSAY_WORDS } from '../../utils/learningEssay.js'
import './RevisionComparison.css'

export default function RevisionComparison({
  originalDraft = '',
  revisedDraft = '',
  resolvedItems = [],
  minWords = MIN_LEARNING_ESSAY_WORDS,
  maxWords = MAX_LEARNING_ESSAY_WORDS,
  onSaveRevision,
  onProceed
}) {
  const [viewMode, setViewMode] = useState('side_by_side') // 'side_by_side' or 'diff'
  const [currentRevised, setCurrentRevised] = useState(revisedDraft)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!currentRevised.trim()) {
      setError('Please enter your revised draft text.')
      return
    }
    const count = currentRevised.trim().split(/\s+/).filter(Boolean).length
    if (count < minWords || count > maxWords) {
      setError(`Your revised essay must contain between ${minWords} and ${maxWords} words (currently ${count} words).`)
      return
    }
    setSaving(true)
    setError('')
    try {
      if (onSaveRevision) {
        await onSaveRevision(currentRevised)
      }
      setIsSaved(true)
    } catch (err) {
      setError(err?.message || 'Failed to submit revision for analysis. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const wordCount = currentRevised.trim() ? currentRevised.trim().split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="rev-comp card-base animate-fade-in">
      <div className="rev-comp__header">
        <div className="rev-comp__header-left">
          <div className="rev-comp__icon-wrap">
            <span className="material-symbols-outlined">difference</span>
          </div>
          <div>
            <h3 className="rev-comp__title">Revision & Enhancement Workspace</h3>
            <p className="rev-comp__sub">Edit and refine your draft based on AI feedback, then submit to re-evaluate target vocabulary.</p>
          </div>
        </div>

        <div className="rev-comp__view-toggle">
          <button
            className={`rev-comp__toggle-btn ${viewMode === 'side_by_side' ? 'rev-comp__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('side_by_side')}
          >
            <span className="material-symbols-outlined">vertical_split</span>
            Side by Side
          </button>
          <button
            className={`rev-comp__toggle-btn ${viewMode === 'diff' ? 'rev-comp__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('diff')}
          >
            <span className="material-symbols-outlined">view_agenda</span>
            Revised Only
          </button>
        </div>
      </div>

      {/* Resolved Badges */}
      {resolvedItems && resolvedItems.length > 0 && (
        <div className="rev-comp__resolved-bar">
          <span className="rev-comp__resolved-label">
            <span className="material-symbols-outlined">task_alt</span> Applied target words ({resolvedItems.length}):
          </span>
          <div className="rev-comp__resolved-chips">
            {resolvedItems.map((item, idx) => (
              <span key={idx} className="rev-comp__chip">
                {typeof item === 'string' ? item : item.word || item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Comparison Grid */}
      <div className={`rev-comp__content rev-comp__content--${viewMode}`}>
        {viewMode === 'side_by_side' && (
          <div className="rev-comp__panel rev-comp__panel--original">
            <div className="rev-comp__panel-title">
              <span className="material-symbols-outlined">history</span>
              Original Draft (Draft 1)
            </div>
            <div className="rev-comp__text-box">
              {originalDraft || 'No previous draft content available.'}
            </div>
          </div>
        )}

        <div className="rev-comp__panel rev-comp__panel--revised">
          <div className="rev-comp__panel-title rev-comp__panel-title--success" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined">auto_fix_high</span>
              Revised Draft (Editable)
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-outline)' }}>
              {wordCount} words
            </span>
          </div>
          <textarea
            className="rev-comp__editor-textarea"
            value={currentRevised}
            onChange={(e) => {
              setCurrentRevised(e.target.value)
              setIsSaved(false)
              setError('')
            }}
            placeholder="Edit your revision here using the AI vocabulary advice..."
            rows={8}
          />
        </div>
      </div>

      <div className="rev-comp__actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSave}
            disabled={saving || !currentRevised.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Saving & Analyzing Revision...
              </>
            ) : isSaved ? (
              <>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>check_circle</span>
                Revision Saved & Analyzed
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">upload_file</span>
                Submit Revision for AI Analysis
              </>
            )}
          </button>
        </div>

        {onProceed && (
          <button
            className="btn-primary rev-comp__proceed-btn"
            onClick={onProceed}
            disabled={!isSaved}
            style={{ opacity: isSaved ? 1 : 0.5, cursor: isSaved ? 'pointer' : 'not-allowed' }}
            title={!isSaved ? 'Submit and analyze revision first before completing' : ''}
          >
            Complete Learning Session
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        )}
      </div>
    </div>
  )
}
