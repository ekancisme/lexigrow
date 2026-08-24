import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { useModal } from '../../contexts/ModalContext.jsx'
import './WriteEssay.css'

const themesList = [
  { value: 'General', label: 'General (Chung)' },
  { value: 'Technology', label: 'Technology (Công nghệ)' },
  { value: 'Education', label: 'Education (Giáo dục)' },
  { value: 'Environment', label: 'Environment (Môi trường)' },
  { value: 'Business', label: 'Business / Economy (Kinh tế)' },
  { value: 'Science', label: 'Science / Healthcare (Y tế & Khoa học)' }
]

export default function WriteEssay() {
  const [searchParams] = useSearchParams()
  const essayId = searchParams.get('id')
  const assignmentId = searchParams.get('assignmentId')
  const navigate = useNavigate()

  const [essayText, setEssayText] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('draft')
  const [saving, setSaving] = useState(false)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('General')
  const [topicSuggestions, setTopicSuggestions] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  // Assignment mode state
  const [assignmentData, setAssignmentData] = useState(null)
  const [allowPaste, setAllowPaste] = useState(true)
  const { showAlert } = useModal()
  const [aiHelperLoading, setAiHelperLoading] = useState(false)
  const [spellErrors, setSpellErrors] = useState([])
  const [wordCount, setWordCount] = useState(0)
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && essayText !== undefined && editorRef.current.innerHTML !== essayText) {
      editorRef.current.innerHTML = essayText
      const text = editorRef.current.innerText || ''
      setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0)
    }
  }, [essayText])

  // Load classes student might be enrolled in (or just list student classes)
  useEffect(() => {
    async function loadStudentData() {
      try {
        // Find if student is in any classes
        await api.get('/auth/me')
        // In this architecture, let's load all classes the student belongs to
        // But for simplicity, we can also query classes endpoint
        // Let's get active classes
        const clsRes = await api.get('/classes')
        setClasses(clsRes.data || [])

        // Load paste configuration
        const pasteRes = await api.get('/essays/paste-config')
        setAllowPaste(pasteRes.allowPaste)
      } catch (err) {
        console.error('Error loading writing settings:', err)
      }
    }
    loadStudentData()
  }, [])

  // Load existing essay if id parameter is provided
  useEffect(() => {
    if (!essayId) return
    async function loadEssay() {
      try {
        const res = await api.get(`/essays/${essayId}`)
        const essay = res.data
        setTitle(essay.title)
        setEssayText(essay.content)
        if (editorRef.current) {
          editorRef.current.innerHTML = essay.content || ''
          const text = editorRef.current.innerText || ''
          setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0)
        }
        if (essay.class) setSelectedClass(essay.class)
        if (essay.theme) setSelectedTheme(essay.theme)
        if (essay.status) setStatus(essay.status)
      } catch (err) {
        console.error('Error loading essay draft:', err)
      }
    }
    loadEssay()
  }, [essayId])

  // Load assignment data if assignmentId is in URL
  useEffect(() => {
    if (!assignmentId) return
    async function loadAssignment() {
      try {
        const res = await api.get(`/assignments/${assignmentId}`)
        const assignment = res.data
        setAssignmentData(assignment)
        // Prefill title and lock class to assignment's class
        if (!essayId) {
          setTitle(assignment.title)
          if (assignment.classId?._id) setSelectedClass(assignment.classId._id)
          else if (assignment.classId) setSelectedClass(assignment.classId)
        }
      } catch (err) {
        console.error('Error loading assignment:', err)
      }
    }
    loadAssignment()
  }, [assignmentId])

  // Load AI suggested topics when theme changes
  useEffect(() => {
    async function fetchTopics() {
      setTopicsLoading(true)
      try {
        const res = await api.get(`/essays/suggest-topics?theme=${selectedTheme}`)
        setTopicSuggestions(res.data || [])
      } catch (err) {
        console.error('Error fetching AI topics:', err)
        // Fallback default suggestions
        setTopicSuggestions([
          `The role of ${selectedTheme} in modern society`,
          `How ${selectedTheme} is changing the way we live`,
          `The future prospects of ${selectedTheme}`,
          `Key challenges and opportunities in ${selectedTheme}`
        ])
      } finally {
        setTopicsLoading(false)
      }
    }
    fetchTopics()
  }, [selectedTheme])

  const handlePaste = (e) => {
    if (!allowPaste) {
      e.preventDefault()
      showAlert('Paste Restricted', 'Pasting content is not allowed for this essay. Please type your essay manually.', 'warning')
      return
    }
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  async function handleSaveDraft() {
    if (!title.trim() || !essayText.trim()) return
    setSaving(true)
    try {
      const payload = {
        title,
        content: essayText,
        classId: selectedClass || undefined,
        theme: selectedTheme,
        assignmentId: assignmentId || undefined,
      }

      if (essayId) {
        await api.put(`/essays/${essayId}`, payload)
      } else {
        const res = await api.post('/essays', payload)
        // Set query param so subsequent saves are updates
        const newUrl = assignmentId
          ? `/student/write-essay?id=${res.data._id}&assignmentId=${assignmentId}`
          : `/student/write-essay?id=${res.data._id}`
        navigate(newUrl, { replace: true })
      }
    } catch (err) {
      showAlert('Error', 'Could not save draft: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !essayText.trim()) {
      showAlert('Missing Information', 'Please provide both a title and essay content before submitting.', 'warning')
      return
    }
    setSaving(true)
    try {
      let targetId = essayId
      const payload = {
        title,
        content: essayText,
        classId: selectedClass || undefined,
        theme: selectedTheme,
        assignmentId: assignmentId || undefined,
      }

      if (essayId) {
        await api.put(`/essays/${essayId}`, payload)
      } else {
        const res = await api.post('/essays', payload)
        targetId = res.data._id
      }

      // Submit for analysis
      await api.patch(`/essays/${targetId}/submit`)
      navigate(`/student/feedback?id=${targetId}`)
    } catch (err) {
      showAlert('Error', 'Could not submit essay: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const isAssignmentClosed = Boolean(
    assignmentData && (
      assignmentData.status === 'closed' || 
      (assignmentData.dueDate && new Date(assignmentData.dueDate) < new Date())
    )
  )

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      const text = editorRef.current.innerText || ''
      setEssayText(html)
      setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0)
    }
  }

  const applyFormat = (type) => {
    if (editorRef.current) {
      editorRef.current.focus()
    }

    switch (type) {
      case 'bold':
        document.execCommand('bold', false, null)
        break
      case 'italic':
        document.execCommand('italic', false, null)
        break
      case 'underline':
        document.execCommand('underline', false, null)
        break
      case 'bullet':
        document.execCommand('insertUnorderedList', false, null)
        break
      case 'number':
        document.execCommand('insertOrderedList', false, null)
        break
      case 'quote':
        document.execCommand('formatBlock', false, 'blockquote')
        break
      default:
        return
    }
    handleEditorInput()
  }

  const handleAIHelper = async (action) => {
    if (!editorRef.current) return

    editorRef.current.focus()
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()
    const fullText = editorRef.current.innerText || ''

    const targetText = selectedText || fullText
    if (!targetText.trim()) {
      showAlert('No Text', 'Please write something first before using AI Help.', 'warning')
      return
    }

    setAiHelperLoading(true)
    try {
      const res = await api.post('/essays/ai-helper', { text: targetText, action })
      
      if (action === 'improve') {
        const improvedText = res.data
        if (selectedText && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          const textNode = document.createTextNode(improvedText)
          range.insertNode(textNode)
          
          range.setStartAfter(textNode)
          range.setEndAfter(textNode)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          editorRef.current.innerHTML = improvedText.replace(/\n/g, '<br>')
        }
        handleEditorInput()
        showAlert('AI Improved', 'AI has successfully enhanced your writing style!', 'success')
      } else if (action === 'spellcheck') {
        const errors = res.data || []
        setSpellErrors(errors)
        if (errors.length === 0) {
          showAlert('Great Job!', 'No spelling or grammar errors found!', 'success')
        } else {
          showAlert('Review Errors', `AI found ${errors.length} grammar/spelling errors. Check the sidebar for suggestions!`, 'info')
        }
      }
    } catch (err) {
      console.error('AI Helper error:', err)
      showAlert('AI Helper Failed', err.message || 'Failed to process with AI helper.', 'error')
    } finally {
      setAiHelperLoading(false)
    }
  }

  const applyCorrection = (errorText, correctionText) => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const newHtml = html.replace(new RegExp(`\\b${errorText}\\b`, 'g'), correctionText)
    editorRef.current.innerHTML = newHtml
    handleEditorInput()
    setSpellErrors(prev => prev.filter(e => e.error !== errorText))
  }

  return (
    <div className="write-essay">
      {/* Header */}
      <section className="write-essay__header">
        <div>
          <h2 className="text-headline-lg">
            {assignmentData ? `Assignment: ${assignmentData.title}` : 'Write Essay'}
          </h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {assignmentData
              ? `Writing for class: ${assignmentData.classId?.name || 'your class'}`
              : 'Compose your essay and let AI analyze your vocabulary growth'}
          </p>
        </div>
        <div className="write-essay__actions">
          <button className="write-essay__btn-secondary" onClick={handleSaveDraft} disabled={saving || isAssignmentClosed}>
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="write-essay__btn-primary" onClick={handleSubmit} disabled={saving || isAssignmentClosed}>
            <span className="material-symbols-outlined">send</span>
            {saving ? 'Submitting...' : 'Submit Essay'}
          </button>
        </div>
      </section>

      {/* Closed Assignment Alert */}
      {isAssignmentClosed && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1.5px solid var(--color-error)',
          color: 'var(--color-error)',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>lock</span>
          <div>
            <strong>Assignment Closed:</strong> This assignment has been closed by your teacher (or is past due). Submissions and edits are no longer accepted.
          </div>
        </div>
      )}

      <div className="write-essay__layout">
        {/* Editor Area */}
        <div className="write-essay__editor-area">
          {status === 'needs_revision' && (
            <div className="write-essay__revision-alert">
              <span className="material-symbols-outlined write-essay__revision-alert-icon">info</span>
              <div className="write-essay__revision-alert-text">
                <strong>Revising Requested Essay:</strong> You are currently updating an essay that your teacher has requested you to revise. Please address their revision comments.
              </div>
            </div>
          )}
          {/* Title & Class */}
          <div className="write-essay__title-field card-base" style={{ display: 'flex', gap: 16, flexDirection: 'row', alignItems: 'center' }}>
            <div style={{ flex: 2 }}>
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 8, display: 'block' }}>Essay Title</label>
              <input
                type="text"
                className="write-essay__title-input"
                placeholder="Enter your essay title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 8, display: 'block' }}>
                Class {assignmentData ? '(Locked by assignment)' : '(Optional)'}
              </label>
              {assignmentData ? (
                <div style={{ height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface-variant)', color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>lock</span>
                  {assignmentData.classId?.name || 'Assigned class'}
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
                >
                  <option value="">No Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="write-essay__editor card-base">
            {/* Toolbar */}
            <div className="write-essay__toolbar" style={{ pointerEvents: aiHelperLoading ? 'none' : 'auto', opacity: aiHelperLoading ? 0.6 : 1 }}>
              <div className="write-essay__toolbar-group">
                <button type="button" className="write-essay__tool-btn" onClick={() => applyFormat('bold')} title="Bold"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_bold</span></button>
                <button type="button" className="write-essay__tool-btn" onClick={() => applyFormat('italic')} title="Italic"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_italic</span></button>
                <button type="button" className="write-essay__tool-btn" onClick={() => applyFormat('underline')} title="Underline"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_underlined</span></button>
              </div>

              <div className="write-essay__toolbar-divider" />
              <div className="write-essay__toolbar-group">
                <button type="button" className="write-essay__tool-btn" onClick={() => handleAIHelper('spellcheck')} title="AI Spellcheck & Grammar"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>spellcheck</span></button>
                <button type="button" className="write-essay__tool-btn" onClick={() => handleAIHelper('improve')} title="AI Auto-Fix / Improve"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_fix_high</span></button>
              </div>
              {aiHelperLoading && (
                <span className="text-label-sm" style={{ color: 'var(--color-primary)', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>sync</span>
                  AI processing...
                </span>
              )}
            </div>

            {/* Text Area */}
            {/* Rich Editor Area */}
            <div
              ref={editorRef}
              className="write-essay__textarea"
              contentEditable="true"
              onInput={handleEditorInput}
              onPaste={handlePaste}
              style={{
                outline: 'none',
                minHeight: '400px',
                padding: '16px',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                overflowY: 'auto',
                textAlign: 'left'
              }}
              placeholder="Start writing your essay here..."
            />

            {/* Footer */}
            <div className="write-essay__editor-footer">
              <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                {wordCount} words
              </span>
              <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                Auto-saved at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="write-essay__side">
          {/* AI Spellcheck & Grammar Results */}
          {spellErrors.length > 0 && (
            <div className="card-base" style={{ borderLeft: '4px solid var(--color-error)' }}>
              <h3 className="text-title-lg" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>spellcheck</span>
                Grammar & Spelling ({spellErrors.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {spellErrors.map((err, idx) => (
                  <div key={idx} style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    backgroundColor: 'var(--color-surface-container-low)', 
                    border: '1px solid var(--color-outline-variant)' 
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--color-error)', fontSize: '13px', fontWeight: 600 }}>
                        {err.error}
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-outline)' }}>
                        arrow_forward
                      </span>
                      <span style={{ color: 'var(--color-success)', fontSize: '13px', fontWeight: 700, backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {err.correction}
                      </span>
                    </div>
                    {err.explanation && (
                      <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)', fontSize: '12px', lineHeight: 1.4, marginBottom: 8 }}>
                        {err.explanation}
                      </p>
                    )}
                    <button 
                      type="button"
                      className="write-essay__btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '11px', width: '100%', justifyContent: 'center' }}
                      onClick={() => applyCorrection(err.error, err.correction)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>done</span>
                      Apply Suggestion
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Brief Card — shown only in assignment mode */}
          {assignmentData && (
            <div className="card-base" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <h3 className="text-title-lg" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 22 }}>assignment</span>
                Assignment Brief
              </h3>
              {assignmentData.description && (
                <p className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 14, lineHeight: 1.6 }}>
                  {assignmentData.description}
                </p>
              )}
              {assignmentData.dueDate && (
                <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_today</span>
                  Due: {new Date(assignmentData.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
              {assignmentData.keywords?.length > 0 && (
                <div>
                  <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Required Keywords</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {assignmentData.keywords.map((kw, i) => (
                      <span key={i} style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Topic Themes Selection */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Select Theme</h3>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="write-essay__theme-select"
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-on-surface)',
                marginBottom: 16,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {themesList.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 className="text-label-md" style={{ margin: 0, fontWeight: 700 }}>AI Suggested Topics</h4>
              {topicsLoading && (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18, color: 'var(--color-primary)' }}>
                  sync
                </span>
              )}
            </div>

            {topicsLoading ? (
              <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined animate-spin" style={{ color: 'var(--color-primary)' }}>progress_activity</span>
                <p className="text-body-sm" style={{ color: 'var(--color-outline)', margin: 0 }}>AI is generating topics...</p>
              </div>
            ) : (
              <div className="write-essay__topics">
                {topicSuggestions.length === 0 ? (
                  <p className="text-body-sm" style={{ color: 'var(--color-outline)', textAlign: 'center', padding: '16px 0' }}>No topics found.</p>
                ) : (
                  topicSuggestions.map((topic, i) => (
                    <button
                      key={i}
                      className={`write-essay__topic ${selectedTopic === topic ? 'write-essay__topic--active' : ''}`}
                      onClick={() => {
                        setSelectedTopic(topic)
                        setTitle(topic)
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lightbulb</span>
                      <span>{topic}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Writing Stats */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Writing Stats</h3>
            <div className="write-essay__stats">
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Paragraphs</span>
                <span className="text-data-mono">{essayText.split('\n\n').filter(Boolean).length || 0}</span>
              </div>
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Sentences</span>
                <span className="text-data-mono">{essayText.split(/[.!?]+/).filter(Boolean).length || 0}</span>
              </div>
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Characters</span>
                <span className="text-data-mono">{essayText.length}</span>
              </div>
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Reading Time</span>
                <span className="text-data-mono">{Math.max(1, Math.ceil(wordCount / 200))} min</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', marginRight: 8 }}>tips_and_updates</span>
              Writing Tips
            </h3>
            <ul className="write-essay__tips">
              <li>Use varied vocabulary to improve your TTR score</li>
              <li>Aim for at least 500 words per essay</li>
              <li>Include topic-specific terminology</li>
              <li>Practice complex sentence structures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
