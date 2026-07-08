import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
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

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0

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
      alert('Error saving draft: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !essayText.trim()) {
      alert('Please provide a title and essay content.')
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
      alert('Error submitting essay: ' + err.message)
    } finally {
      setSaving(false)
    }
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
          <button className="write-essay__btn-secondary" onClick={handleSaveDraft} disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="write-essay__btn-primary" onClick={handleSubmit} disabled={saving}>
            <span className="material-symbols-outlined">send</span>
            {saving ? 'Submitting...' : 'Submit Essay'}
          </button>
        </div>
      </section>

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
            <div className="write-essay__toolbar">
              <div className="write-essay__toolbar-group">
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_bold</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_italic</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_underlined</span></button>
              </div>
              <div className="write-essay__toolbar-divider" />
              <div className="write-essay__toolbar-group">
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_list_bulleted</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_list_numbered</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_quote</span></button>
              </div>
              <div className="write-essay__toolbar-divider" />
              <div className="write-essay__toolbar-group">
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>spellcheck</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_fix_high</span></button>
              </div>
            </div>

            {/* Text Area */}
            <textarea
              className="write-essay__textarea"
              placeholder="Start writing your essay here..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={16}
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
