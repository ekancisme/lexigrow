import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './SystemPromptsManagement.css'

const CATEGORIES = ['Feedback', 'Analysis', 'Reports', 'Scoring', 'Other']

// What the FINAL merged prompt looks like (simplified view)
const DEFAULT_PROMPT_PREVIEW = `You are an advanced English writing analysis AI for the LexiGrow platform.
Analyze the student's essay and return a JSON response with EXACTLY this structure:
{ overallScore, scores: { vocabularyDiversity, grammarAccuracy, coherence, complexityIndex },
  newWordsDetected, suggestions, learningPatterns, nextEssaySuggestions }

[← This JSON format is ALWAYS preserved by the system]

Rules:
- vocabularyDiversity (TTR) = unique words / total words
- Provide ≥2 strengths and ≥2 improvements
- Return ONLY valid JSON, no markdown formatting`

// Example of how teacher instructions get injected
const MERGED_PROMPT_EXAMPLE = `[...LexiGrow default AI instructions + JSON format...]

--- TEACHER'S ADDITIONAL INSTRUCTIONS FOR THIS CLASS ---
[Your custom instructions here]
--- END OF TEACHER INSTRUCTIONS ---

[...JSON format Rules section preserved...]`

export default function SystemPromptsManagement() {
  const [prompts, setPrompts] = useState([])
  const [activePrompt, setActivePrompt] = useState(null)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [editText, setEditText] = useState('')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('Feedback')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // View mode: 'editor' | 'compare' | 'howto'
  const [viewMode, setViewMode] = useState('editor')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Feedback')
  const [creating, setCreating] = useState(false)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Test modal
  const [showTest, setShowTest] = useState(false)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadPrompts() {
    try {
      const res = await api.get('/prompts')
      const list = res.data || []
      setPrompts(list)
      const active = list.find(p => p.status === 'active') || null
      setActivePrompt(active)
      return list
    } catch (err) {
      console.error('Error fetching prompts:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  function selectPrompt(p) {
    setSelectedPrompt(p)
    setEditText(p.template || '')
    setEditName(p.name || '')
    setEditCategory(p.category || 'Feedback')
    setIsDirty(false)
    setTestResult(null)
  }

  async function handleActivate() {
    if (!selectedPrompt) return
    setActivating(true)
    try {
      const res = await api.post(`/prompts/${selectedPrompt._id}/activate`)
      const updated = res.data
      setSelectedPrompt(updated)
      const list = await loadPrompts()
      const newActive = list.find(p => p._id === updated._id)
      if (newActive) setSelectedPrompt(newActive)
      showToast(`✅ "${updated.name}" is now ACTIVE — students will use this prompt!`)
    } catch (err) {
      showToast('Error activating prompt: ' + err.message, 'error')
    } finally {
      setActivating(false)
    }
  }

  async function handleDeactivate() {
    if (!selectedPrompt) return
    setActivating(true)
    try {
      const res = await api.post(`/prompts/${selectedPrompt._id}/deactivate`)
      const updated = res.data
      setSelectedPrompt(updated)
      await loadPrompts()
      showToast(`Prompt deactivated. System default prompt will be used.`, 'info')
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setActivating(false)
    }
  }

  async function handleCreatePrompt() {
    if (!newName.trim()) {
      showToast('Please enter a prompt name', 'error')
      return
    }
    setCreating(true)
    try {
      const res = await api.post('/prompts', {
        name: newName.trim(),
        category: newCategory,
        // Teacher only writes their ADDITIONAL instructions.
        // The system auto-merges this with the default prompt's JSON format.
        template: `This class is at [beginner/intermediate/advanced] level.

Please adjust the feedback tone and focus as follows:
- Focus especially on: [grammar / vocabulary / coherence / structure]
- Use [simple / standard / academic] language in suggestions
- Vocabulary recommendations should be at [A2 / B1 / B2 / C1] level
- Be [encouraging / strict / detailed] in feedback

[✏️ Edit above — this text will be injected into the LexiGrow default AI prompt.
   You do NOT need to copy the JSON format — it is preserved automatically.]`,
      })
      const list = await loadPrompts()
      const created = list.find(p => p._id === res.data._id) || res.data
      selectPrompt(created)
      setShowCreate(false)
      setNewName('')
      setNewCategory('Feedback')
      showToast(`Prompt "${created.name}" created! Edit the template and set it as Active.`)
    } catch (err) {
      showToast('Error creating prompt: ' + err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleSaveChanges() {
    if (!selectedPrompt) return
    setSaving(true)
    try {
      const res = await api.put(`/prompts/${selectedPrompt._id}`, {
        name: editName,
        category: editCategory,
        template: editText,
      })
      const updated = res.data
      setSelectedPrompt(updated)
      setIsDirty(false)
      await loadPrompts()
      showToast('Changes saved successfully!')
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePrompt() {
    if (!selectedPrompt) return
    setDeleting(true)
    try {
      await api.delete(`/prompts/${selectedPrompt._id}`)
      setShowDeleteConfirm(false)
      setSelectedPrompt(null)
      setEditText('')
      setEditName('')
      const list = await loadPrompts()
      if (list.length > 0) selectPrompt(list[0])
      showToast('Prompt deleted.')
    } catch (err) {
      showToast('Error deleting: ' + err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function openTest() {
    setShowTest(true)
    setTestResult(null)
    setTestText('The rapid advancement of automation technologies has fundamentally transformed healthcare systems worldwide. Artificial intelligence now enables physicians to diagnose diseases with unprecedented accuracy, while robotic surgical systems perform intricate procedures with remarkable precision. Furthermore, machine learning algorithms can analyze vast datasets to predict patient outcomes and personalize treatment plans.')
  }

  async function runPromptTest() {
    setTesting(true)
    try {
      const res = await api.post(`/prompts/${selectedPrompt._id}/test`, { sampleText: testText })
      setTestResult(res.data)
      await loadPrompts() // refresh lastUsed
    } catch (err) {
      showToast('Error testing prompt: ' + err.message, 'error')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="spm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>progress_activity</span>
      </div>
    )
  }

  const isSelectedActive = selectedPrompt?.status === 'active'

  return (
    <div className="spm">
      {/* ── Toast ── */}
      {toast && (
        <div className={`spm__toast spm__toast--${toast.type || 'success'}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
          </span>
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <section className="spm__header">
        <div>
          <h2 className="text-headline-lg">System Prompts Management</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Customize the AI instructions used to analyze your students' essays
          </p>
        </div>
        <button className="spm__new-btn" onClick={() => setShowCreate(true)}>
          <span className="material-symbols-outlined">add</span> New Prompt
        </button>
      </section>

      {/* ── ACTIVE STATUS BANNER ── */}
      <div className={`spm__status-banner ${activePrompt ? 'spm__status-banner--on' : 'spm__status-banner--off'}`}>
        <div className="spm__status-banner-left">
          <span className={`spm__status-dot ${activePrompt ? 'spm__status-dot--on' : 'spm__status-dot--off'}`} />
          <div>
            {activePrompt ? (
              <>
                <p className="text-label-md" style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                  Custom Prompt ACTIVE
                </p>
                <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Students' essays are analyzed using: <strong>"{activePrompt.name}"</strong>
                </p>
              </>
            ) : (
              <>
                <p className="text-label-md" style={{ fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>
                  No Custom Prompt Active
                </p>
                <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Students' essays use the <strong>LexiGrow default system prompt</strong>
                </p>
              </>
            )}
          </div>
        </div>
        <button className="spm__howto-btn" onClick={() => setViewMode(viewMode === 'howto' ? 'editor' : 'howto')}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>help</span>
          How It Works
        </button>
      </div>

      {/* ── HOW IT WORKS PANEL ── */}
      {viewMode === 'howto' && (
        <div className="spm__howto card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8 }}>lightbulb</span>
            How System Prompts Work
          </h3>
          <div className="spm__howto-grid">
            <div className="spm__howto-step">
              <div className="spm__howto-num">1</div>
              <div>
                <p className="text-label-md" style={{ fontWeight: 700, marginBottom: 4 }}>Create a Prompt</p>
                <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Click "New Prompt" and customize the AI instruction template for your class.
                </p>
              </div>
            </div>
            <div className="spm__howto-step">
              <div className="spm__howto-num">2</div>
              <div>
                <p className="text-label-md" style={{ fontWeight: 700, marginBottom: 4 }}>Test It</p>
                <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Use "Test Prompt" to see exactly what AI output your students will receive. Compare with the default.
                </p>
              </div>
            </div>
            <div className="spm__howto-step">
              <div className="spm__howto-num">3</div>
              <div>
                <p className="text-label-md" style={{ fontWeight: 700, marginBottom: 4 }}>Set as Active</p>
                <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Click "Set as Active" — from this moment all student essay submissions will use your custom prompt.
                </p>
              </div>
            </div>
            <div className="spm__howto-step">
              <div className="spm__howto-num">4</div>
              <div>
                <p className="text-label-md" style={{ fontWeight: 700, marginBottom: 4 }}>See the Difference</p>
                <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Each essay analysis shows a badge: "Custom Prompt Used" vs "Default Prompt". Compare quality!
                </p>
              </div>
            </div>
          </div>

          <div className="spm__howto-diff">
            <div className="spm__howto-diff-col spm__howto-diff-col--default">
              <p className="text-label-md" style={{ fontWeight: 700, marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>settings</span> Without Custom Prompt
              </p>
              <ul className="spm__howto-list">
                <li>Uses LexiGrow's built-in AI instruction</li>
                <li>General feedback for all students</li>
                <li>Standard scoring criteria</li>
                <li>No teacher personalization</li>
              </ul>
            </div>
            <div className="spm__howto-diff-col spm__howto-diff-col--custom">
              <p className="text-label-md" style={{ fontWeight: 700, marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>auto_awesome</span> With Your Custom Prompt
              </p>
              <ul className="spm__howto-list">
                <li>Uses YOUR AI instruction template</li>
                <li>Tailored feedback for your class level</li>
                <li>Custom scoring emphasis (grammar, vocab, etc.)</li>
                <li>Class-specific learning tips</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="spm__layout">
        {/* ── Left: Prompt List ── */}
        <div className="spm__list">
          {prompts.length === 0 ? (
            <div className="card-base spm__empty">
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>psychology</span>
              <p className="text-body-md" style={{ color: 'var(--color-outline)', marginTop: 8 }}>No prompts yet.</p>
              <button className="spm__new-btn" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
                <span className="material-symbols-outlined">add</span> Create First Prompt
              </button>
            </div>
          ) : (
            prompts.map(p => (
              <div
                key={p._id}
                className={`spm__item card-base ${selectedPrompt?._id === p._id ? 'spm__item--selected' : ''} ${p.status === 'active' ? 'spm__item--active' : ''}`}
                onClick={() => selectPrompt(p)}
              >
                <div className="spm__item-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    {p.status === 'active' && (
                      <span className="material-symbols-outlined spm__item-active-icon" title="This prompt is active">bolt</span>
                    )}
                    <h4 className="text-label-md" style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </h4>
                  </div>
                  <span className={`spm__badge ${p.status === 'active' ? 'spm__badge--active' : 'spm__badge--draft'}`}>
                    {p.status === 'active' ? 'ACTIVE' : 'draft'}
                  </span>
                </div>
                <div className="spm__item-meta">
                  <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{p.category}</span>
                  <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                    {p.lastUsed ? `Tested: ${new Date(p.lastUsed).toLocaleDateString()}` : 'Never tested'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Right: Editor or Empty ── */}
        {selectedPrompt ? (
          <div className="spm__editor card-base">
            {/* Active Banner on selected prompt */}
            {isSelectedActive && (
              <div className="spm__active-pill">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                This prompt is ACTIVE — students are using it right now
              </div>
            )}

            {/* View Tabs */}
            <div className="spm__tabs">
              <button
                className={`spm__tab ${viewMode === 'editor' || viewMode === 'howto' ? 'spm__tab--active' : ''}`}
                onClick={() => setViewMode('editor')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span> Editor
              </button>
              <button
                className={`spm__tab ${viewMode === 'compare' ? 'spm__tab--active' : ''}`}
                onClick={() => setViewMode('compare')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>compare</span> Compare with Default
              </button>
            </div>

            {viewMode !== 'compare' ? (
              /* ── Editor Tab ── */
              <>
                <div className="spm__editor-fields">
                  <div className="spm__field-group" style={{ flex: 2 }}>
                    <label className="spm__field-label">Prompt Name</label>
                    <input
                      className="spm__input"
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setIsDirty(true) }}
                      placeholder="Enter prompt name..."
                    />
                  </div>
                  <div className="spm__field-group" style={{ flex: 1 }}>
                    <label className="spm__field-label">Category</label>
                    <select
                      className="spm__select"
                      value={editCategory}
                      onChange={e => { setEditCategory(e.target.value); setIsDirty(true) }}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label className="spm__field-label">
                    Your Additional Instructions
                    <span style={{ color: 'var(--color-outline)', fontWeight: 400, marginLeft: 8, fontSize: '0.8em' }}>
                      Injected into LexiGrow's default prompt — JSON format preserved automatically
                    </span>
                  </label>
                  <textarea
                    className="spm__textarea"
                    rows={14}
                    value={editText}
                    onChange={e => { setEditText(e.target.value); setIsDirty(true) }}
                    placeholder="Example: This is a beginner class. Focus on grammar corrections. Use simple English in feedback. Recommend A2-B1 vocabulary..."
                  />
                  <div className="spm__textarea-hint">
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
                    <span>{editText.length} chars · {editText.split(/\s+/).filter(Boolean).length} words · Only write your class-specific instructions here</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="spm__editor-actions">
                  <button className="spm__delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Delete
                  </button>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="spm__test-btn" onClick={openTest}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span> Test Prompt
                    </button>

                    {isDirty && (
                      <button className="spm__save-btn" onClick={handleSaveChanges} disabled={saving}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                        {saving ? 'Saving...' : 'Save Changes ●'}
                      </button>
                    )}

                    {!isDirty && (
                      isSelectedActive ? (
                        <button className="spm__deactivate-btn" onClick={handleDeactivate} disabled={activating}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>power_off</span>
                          {activating ? 'Deactivating...' : 'Deactivate'}
                        </button>
                      ) : (
                        <button className="spm__activate-btn" onClick={handleActivate} disabled={activating}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                          {activating ? 'Activating...' : 'Set as Active'}
                        </button>
                      )
                    )}

                    {isDirty && (
                      <p className="spm__save-hint">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                        Save changes first, then set as active
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* ── Compare Tab ── */
              <div className="spm__compare">
                <div className="spm__compare-explanation">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>merge</span>
                  <p className="text-body-sm">
                    Your instructions are <strong>injected into</strong> the LexiGrow default prompt — the JSON output format is always preserved.
                    The final prompt sent to AI = <strong>Default base + Your instructions + JSON rules</strong>.
                  </p>
                </div>
                <div className="spm__compare-grid">
                  <div className="spm__compare-col">
                    <div className="spm__compare-header spm__compare-header--default">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                      LexiGrow Base Prompt (always present)
                      {!isSelectedActive && <span className="spm__compare-using-tag">Only this</span>}
                    </div>
                    <pre className="spm__compare-text">{DEFAULT_PROMPT_PREVIEW}</pre>
                  </div>
                  <div className="spm__compare-col">
                    <div className="spm__compare-header spm__compare-header--custom">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                      Your Additional Instructions: "{selectedPrompt.name}"
                      {isSelectedActive && <span className="spm__compare-using-tag spm__compare-using-tag--active">Injected ✓</span>}
                    </div>
                    <pre className="spm__compare-text">{editText || '(empty — add your class-specific instructions)'}</pre>
                    <div className="spm__compare-merge-note">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                      This text is inserted between the base prompt and the JSON Rules section
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  {!isSelectedActive ? (
                    <button className="spm__activate-btn" onClick={handleActivate} disabled={activating || isDirty}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                      {isDirty ? 'Save changes first' : activating ? 'Activating...' : 'Activate — Inject into AI Prompt'}
                    </button>
                  ) : (
                    <button className="spm__deactivate-btn" onClick={handleDeactivate} disabled={activating}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>power_off</span>
                      {activating ? 'Deactivating...' : 'Deactivate — Back to Default Only'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card-base spm__editor spm__editor--empty">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-outline)' }}>edit_note</span>
            <p className="text-body-md" style={{ color: 'var(--color-outline)', marginTop: 12 }}>
              {prompts.length === 0 ? 'Create your first prompt to get started.' : 'Select a prompt from the list to edit.'}
            </p>
          </div>
        )}
      </div>

      {/* ══════ CREATE MODAL ══════ */}
      {showCreate && (
        <div className="spm__overlay" onClick={() => setShowCreate(false)}>
          <div className="spm__modal card-base" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 className="text-headline-md" style={{ marginBottom: 8 }}>Create New Prompt</h3>
            <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 20 }}>
              A starter template will be created — you can fully customize it afterward.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label className="spm__field-label">Prompt Name *</label>
              <input
                className="spm__input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., Beginner Class Feedback, IELTS Writing Prompt..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreatePrompt()}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="spm__field-label">Category</label>
              <select className="spm__select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="spm__modal-actions">
              <button className="spm__cancel-btn" onClick={() => { setShowCreate(false); setNewName('') }}>Cancel</button>
              <button className="spm__activate-btn" onClick={handleCreatePrompt} disabled={creating}>
                {creating ? 'Creating...' : 'Create Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ DELETE CONFIRM MODAL ══════ */}
      {showDeleteConfirm && (
        <div className="spm__overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="spm__modal card-base" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 12, display: 'block' }}>
              warning
            </span>
            <h3 className="text-headline-md" style={{ marginBottom: 8 }}>Delete Prompt?</h3>
            <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 24 }}>
              Are you sure you want to delete <strong>"{selectedPrompt?.name}"</strong>?
              {isSelectedActive && <><br /><span style={{ color: 'var(--color-error)' }}>⚠ This is your ACTIVE prompt. Deleting it will revert to default.</span></>}
            </p>
            <div className="spm__modal-actions">
              <button className="spm__cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="spm__delete-confirm-btn" onClick={handleDeletePrompt} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TEST MODAL ══════ */}
      {showTest && (
        <div className="spm__overlay" onClick={() => setShowTest(false)}>
          <div className="spm__modal spm__modal--wide card-base" onClick={e => e.stopPropagation()}>
            <div className="spm__test-header">
              <div>
                <h3 className="text-headline-md">Test Prompt</h3>
                <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                  Simulates what AI will return for a student essay using:
                  <strong style={{ color: 'var(--color-primary)', marginLeft: 4 }}>"{selectedPrompt?.name}"</strong>
                </p>
              </div>
              <button className="spm__icon-btn" onClick={() => setShowTest(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="spm__field-label">Sample Essay Text</label>
              <textarea
                className="spm__textarea"
                rows={6}
                value={testText}
                onChange={e => setTestText(e.target.value)}
                placeholder="Paste a sample student essay here..."
              />
              <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                {testText.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>

            <button
              className="spm__run-test-btn"
              onClick={runPromptTest}
              disabled={testing || testText.split(/\s+/).filter(Boolean).length < 20}
            >
              <span className="material-symbols-outlined">{testing ? 'hourglass_empty' : 'smart_toy'}</span>
              {testing ? 'AI is analyzing...' : 'Run AI Analysis with This Prompt'}
            </button>
            {testText.split(/\s+/).filter(Boolean).length < 20 && (
              <p className="text-label-sm" style={{ color: 'var(--color-outline)', textAlign: 'center', marginTop: 4 }}>
                Write at least 20 words to run the test
              </p>
            )}

            {testResult && (
              <div className="spm__result">
                <div className="spm__result-header">
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>analytics</span>
                  <h4 className="text-title-md">AI Analysis Result</h4>
                  <span className="spm__result-tag">Prompt: "{selectedPrompt?.name}"</span>
                </div>

                {/* Score Grid */}
                {testResult.overallScore !== undefined && (
                  <div className="spm__score-grid">
                    <div className="spm__score-card spm__score-card--main">
                      <span className="spm__score-val" style={{ color: 'var(--color-primary)' }}>
                        {testResult.overallScore}<span style={{ fontSize: '0.5em' }}>/10</span>
                      </span>
                      <span className="spm__score-label">Overall</span>
                    </div>
                    {testResult.scores && Object.entries(testResult.scores).map(([k, v]) => (
                      <div key={k} className="spm__score-card">
                        <span className="spm__score-val">{typeof v === 'number' ? (v > 1 ? v.toFixed(1) : v.toFixed(2)) : v}</span>
                        <span className="spm__score-label">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {testResult.suggestions?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p className="text-label-md" style={{ fontWeight: 600, marginBottom: 8 }}>Suggestions</p>
                    {testResult.suggestions.map((s, i) => (
                      <div key={i} className={`spm__suggestion spm__suggestion--${s.type}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, flexShrink: 0 }}>
                          {s.type === 'strength' ? 'thumb_up' : 'lightbulb'}
                        </span>
                        <span className="text-body-sm">{s.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Learning Patterns */}
                {testResult.learningPatterns && (
                  <div style={{ marginBottom: 12 }}>
                    <p className="text-label-md" style={{ fontWeight: 600, marginBottom: 8 }}>Learning Patterns</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <span className={`spm__chip ${testResult.learningPatterns.paddedSentences ? 'spm__chip--warn' : 'spm__chip--ok'}`}>
                        {testResult.learningPatterns.paddedSentences ? '⚠ Padding Detected' : '✓ No Padding'}
                      </span>
                      <span className={`spm__chip ${testResult.learningPatterns.plagiarismDetected ? 'spm__chip--warn' : 'spm__chip--ok'}`}>
                        {testResult.learningPatterns.plagiarismDetected ? '⚠ Plagiarism Risk' : '✓ Original'}
                      </span>
                      <span className="spm__chip spm__chip--info">
                        Status: {testResult.learningPatterns.learningStatus}
                      </span>
                    </div>
                    {testResult.learningPatterns.feedback && (
                      <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {testResult.learningPatterns.feedback}
                      </p>
                    )}
                  </div>
                )}



                <details>
                  <summary className="text-label-sm" style={{ cursor: 'pointer', color: 'var(--color-outline)' }}>
                    View raw JSON response
                  </summary>
                  <pre className="spm__json">{JSON.stringify(testResult, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
