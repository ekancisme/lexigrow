import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './SystemPromptsManagement.css'

export default function SystemPromptsManagement() {
  const [prompts, setPrompts] = useState([])
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [editText, setEditText] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Feedback')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Test modal/drawer state
  const [showTest, setShowTest] = useState(false)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  async function loadPrompts() {
    try {
      const res = await api.get('/prompts')
      setPrompts(res.data || [])
      if (res.data && res.data.length > 0) {
        setSelectedPrompt(res.data[0])
        setEditText(res.data[0].template || '')
      }
    } catch (err) {
      console.error('Error fetching prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  async function handleCreatePrompt() {
    const promptName = prompt('Enter prompt name:')
    if (!promptName) return
    setSaving(true)
    try {
      const res = await api.post('/prompts', {
        name: promptName,
        category: 'Feedback',
        template: 'Standard system prompt template...',
      })
      await loadPrompts()
      // Select the new prompt
      const newPrompt = res.data
      setSelectedPrompt(newPrompt)
      setEditText(newPrompt.template || '')
    } catch (err) {
      alert('Error creating prompt: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveChanges() {
    if (!selectedPrompt) return
    setSaving(true)
    try {
      await api.put(`/prompts/${selectedPrompt._id}`, {
        template: editText,
      })
      alert('Prompt changes saved successfully!')
      loadPrompts()
    } catch (err) {
      alert('Error saving prompt changes: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTestPrompt() {
    if (!selectedPrompt) return
    setShowTest(true)
    setTestResult(null)
    setTestText('Write a sample text here to test the system prompt. Example: The rapid advancement of automation technologies has fundamentally transformed healthcare.')
  }

  async function runPromptTest() {
    setTesting(true)
    try {
      const res = await api.post(`/prompts/${selectedPrompt._id}/test`, {
        sampleText: testText,
      })
      setTestResult(res.data)
    } catch (err) {
      alert('Error testing prompt: ' + err.message)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="sys-prompts" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="sys-prompts">
      <section className="sys-prompts__header">
        <div>
          <h2 className="text-headline-lg">System Prompts Management</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Configure AI prompts used for essay analysis and feedback generation</p>
        </div>
        <button className="sys-prompts__new-btn" onClick={handleCreatePrompt}>
          <span className="material-symbols-outlined">add</span> New Prompt
        </button>
      </section>

      <div className="sys-prompts__layout">
        <div className="sys-prompts__list">
          {prompts.length === 0 ? (
            <div className="card-base" style={{ padding: 16, textAlign: 'center', color: 'var(--color-outline)' }}>
              No prompts. Click "New Prompt" to create one.
            </div>
          ) : (
            prompts.map(p => (
              <div key={p._id} className={`sys-prompts__item card-base ${selectedPrompt?._id === p._id ? 'sys-prompts__item--active' : ''}`} onClick={() => { setSelectedPrompt(p); setEditText(p.template); }}>
                <div className="sys-prompts__item-top">
                  <h4 className="text-label-md" style={{ fontWeight: 700 }}>{p.name}</h4>
                  <span className={`sys-prompts__status sys-prompts__status--${p.status || 'active'}`}>{p.status || 'active'}</span>
                </div>
                <div className="sys-prompts__item-meta">
                  <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{p.category}</span>
                  <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                    Last used: {p.lastUsed ? new Date(p.lastUsed).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedPrompt ? (
          <div className="sys-prompts__editor card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 8 }}>{selectedPrompt.name}</h3>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 20 }}>Category: {selectedPrompt.category}</p>
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 8 }}>Prompt Template</label>
            <textarea className="sys-prompts__textarea" rows={12} value={editText} onChange={e => setEditText(e.target.value)} />
            <div className="sys-prompts__editor-actions">
              <button className="sys-prompts__test-btn" onClick={handleTestPrompt}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span> Test Prompt</button>
              <button className="sys-prompts__save-btn" onClick={handleSaveChanges} disabled={saving}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> {saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        ) : (
          <div className="sys-prompts__editor card-base" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-outline)' }}>
            Select a system prompt from the list to edit.
          </div>
        )}
      </div>

      {showTest && (
        <div className="class-mgmt__modal-overlay" onClick={() => setShowTest(false)}>
          <div className="class-mgmt__modal card-base" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <h3 className="text-headline-md" style={{ marginBottom: 16 }}>Test System Prompt</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label className="text-label-md" style={{ display: 'block', marginBottom: 8 }}>Sample Essay Content</label>
              <textarea
                className="class-mgmt__textarea"
                rows={6}
                value={testText}
                onChange={e => setTestText(e.target.value)}
              />
            </div>

            <button className="sys-prompts__test-btn" style={{ width: '100%', marginBottom: 16 }} onClick={runPromptTest} disabled={testing}>
              {testing ? 'Testing System Prompt with AI...' : 'Run Test Analysis'}
            </button>

            {testResult && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: 'var(--color-surface-container-low)', padding: 16, borderRadius: 8 }}>
                <h4 className="text-title-md" style={{ marginBottom: 8 }}>AI Evaluation Response:</h4>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px' }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="class-mgmt__cancel-btn" onClick={() => setShowTest(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
