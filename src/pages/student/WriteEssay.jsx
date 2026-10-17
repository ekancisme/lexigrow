import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import { useModal } from '../../contexts/ModalContext.jsx'
import { sanitizeHtml } from '../../utils/sanitizeHtml.js'
import './WriteEssay.css'

export default function WriteEssay() {
  const { t, language } = useLanguage()
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
  const [assignmentData, setAssignmentData] = useState(null)
  const [allowPaste, setAllowPaste] = useState(true)
  const { showAlert } = useModal()
  const [aiHelperLoading, setAiHelperLoading] = useState(false)
  const [spellErrors, setSpellErrors] = useState([])
  const [wordCount, setWordCount] = useState(0)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const editorRef = useRef(null)

  const themesList = [
    { value: 'General', label: language === 'vi' ? 'Tổng quan & Xã hội' : 'General & Society' },
    { value: 'Technology', label: language === 'vi' ? 'Công nghệ & Đổi mới' : 'Technology & AI' },
    { value: 'Education', label: language === 'vi' ? 'Giáo dục & Học đường' : 'Education & Learning' },
    { value: 'Environment', label: language === 'vi' ? 'Môi trường & Sinh thái' : 'Environment & Climate' },
    { value: 'Business', label: language === 'vi' ? 'Kinh tế & Thương mại' : 'Business & Economy' },
    { value: 'Science', label: language === 'vi' ? 'Khoa học & Y tế' : 'Science & Healthcare' }
  ]

  useEffect(() => {
    if (editorRef.current && essayText !== undefined) {
      const cleanHtml = sanitizeHtml(essayText)
      if (editorRef.current.innerHTML !== cleanHtml) {
        editorRef.current.innerHTML = cleanHtml
        const text = editorRef.current.innerText || ''
        setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0)
      }
    }
  }, [essayText])

  // Load student classes and paste configuration
  useEffect(() => {
    async function loadStudentData() {
      try {
        await api.get('/auth/me')
        const clsRes = await api.get('/classes')
        setClasses(clsRes.data || [])

        const pasteRes = await api.get('/essays/paste-config')
        if (pasteRes && typeof pasteRes.allowPaste === 'boolean') {
          setAllowPaste(pasteRes.allowPaste)
        }
      } catch (err) {
        console.error('Error loading writing settings:', err)
      }
    }
    loadStudentData()
  }, [])

  // Load existing essay if id is provided (Draft / Revision flow)
  useEffect(() => {
    if (!essayId) return
    async function loadEssay() {
      try {
        const res = await api.get(`/essays/${essayId}`)
        const essay = res.data
        setTitle(essay.title || '')
        setEssayText(essay.content || '')
        if (editorRef.current) {
          editorRef.current.innerHTML = sanitizeHtml(essay.content || '')
          const text = editorRef.current.innerText || ''
          setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0)
        }
        if (essay.class) setSelectedClass(essay.class)
        if (essay.theme) setSelectedTheme(essay.theme)
        if (essay.status) setStatus(essay.status)
        if (essay.updatedAt) setLastSavedAt(new Date(essay.updatedAt))
      } catch (err) {
        console.error('Error loading essay draft:', err)
      }
    }
    loadEssay()
  }, [essayId])

  // Load assignment data if assignmentId is present
  useEffect(() => {
    if (!assignmentId) return
    async function loadAssignment() {
      try {
        const res = await api.get(`/assignments/${assignmentId}`)
        const assignment = res.data
        setAssignmentData(assignment)
        if (!essayId) {
          setTitle(assignment.title || '')
          if (assignment.classId?._id) setSelectedClass(assignment.classId._id)
          else if (assignment.classId) setSelectedClass(assignment.classId)
        }
      } catch (err) {
        console.error('Error loading assignment:', err)
      }
    }
    loadAssignment()
  }, [assignmentId, essayId])

  // Fetch AI suggested topics on theme change
  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    async function fetchTopics() {
      setTopicsLoading(true)
      try {
        const res = await api.get(`/essays/suggest-topics?theme=${encodeURIComponent(selectedTheme)}`, {
          signal: controller.signal
        })
        if (isActive) {
          setTopicSuggestions(res.data || [])
        }
      } catch (err) {
        if (!isActive || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        console.error('Error fetching AI topics:', err)
        if (isActive) {
          setTopicSuggestions([
            `The role of ${selectedTheme} in modern society`,
            `How ${selectedTheme} is shaping our future opportunities`,
            `The key challenges and innovations in ${selectedTheme}`,
            `Critical ethical considerations surrounding ${selectedTheme}`
          ])
        }
      } finally {
        if (isActive) {
          setTopicsLoading(false)
        }
      }
    }

    fetchTopics()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedTheme])

  const handlePaste = (e) => {
    if (!allowPaste) {
      e.preventDefault()
      showAlert(
        t('writing.pasteRestrictedTitle', 'Paste Restricted'),
        t('writing.pasteRestrictedDesc', 'Pasting content is not allowed for this essay. Please type your essay manually.'),
        'warning'
      )
      return
    }
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  async function handleSaveDraft() {
    if (!title.trim() && !essayText.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: title.trim() || (language === 'vi' ? 'Bản nháp chưa đặt tên' : 'Untitled Draft'),
        content: essayText,
        classId: selectedClass || undefined,
        theme: selectedTheme,
        assignmentId: assignmentId || undefined,
      }

      if (essayId) {
        await api.put(`/essays/${essayId}`, payload)
      } else {
        const res = await api.post('/essays', payload)
        const newUrl = assignmentId
          ? `/student/write-essay?id=${res.data._id}&assignmentId=${assignmentId}`
          : `/student/write-essay?id=${res.data._id}`
        navigate(newUrl, { replace: true })
      }
      setLastSavedAt(new Date())
    } catch (err) {
      showAlert(t('common.error', 'Error'), t('writing.saveDraft', 'Save Draft') + ': ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !essayText.trim()) {
      showAlert(
        t('writing.missingInfoTitle', 'Missing Information'),
        t('writing.missingInfoDesc', 'Please provide both a title and essay content before submitting.'),
        'warning'
      )
      return
    }
    setSaving(true)
    try {
      let targetId = essayId
      const payload = {
        title: title.trim(),
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

      await api.patch(`/essays/${targetId}/submit`)
      navigate(`/student/feedback?id=${targetId}`)
    } catch (err) {
      showAlert(t('common.error', 'Error'), err.message || 'Could not submit essay', 'error')
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
      showAlert(
        t('writing.missingInfoTitle', 'No Text'),
        language === 'vi' ? 'Vui lòng gõ nội dung bài viết trước khi sử dụng trợ lý AI.' : 'Please write something first before using AI Help.',
        'warning'
      )
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
          editorRef.current.innerHTML = sanitizeHtml(improvedText.replace(/\n/g, '<br>'))
        }
        handleEditorInput()
        showAlert(
          language === 'vi' ? 'Đã tối ưu câu từ' : 'AI Improved',
          language === 'vi' ? 'Trợ lý AI đã nâng cao văn phong và độ phong phú từ vựng thành công!' : 'AI has successfully enhanced your writing style!',
          'success'
        )
      } else if (action === 'spellcheck') {
        const occurrenceCounts = new Map()
        const errors = (Array.isArray(res.data) ? res.data : []).map((item, index) => {
          const error = String(item?.error || '')
          const occurrenceIndex = occurrenceCounts.get(error) || 0
          occurrenceCounts.set(error, occurrenceIndex + 1)
          return { ...item, occurrenceIndex, correctionId: `${index}:${error}:${occurrenceIndex}` }
        }).filter((item) => item.error && item.correction)
        setSpellErrors(errors)
        if (errors.length === 0) {
          showAlert(
            language === 'vi' ? 'Rất tốt!' : 'Great Job!',
            language === 'vi' ? 'Không phát hiện lỗi chính tả hoặc ngữ pháp nào!' : 'No spelling or grammar errors found!',
            'success'
          )
        } else {
          showAlert(
            language === 'vi' ? 'Đã kiểm tra ngữ pháp' : 'Review Errors',
            language === 'vi'
              ? `AI tìm thấy ${errors.length} điểm cần sửa ngữ pháp/chính tả. Hãy xem cột bên phải để duyệt sửa!`
              : `AI found ${errors.length} grammar/spelling errors. Check the sidebar for suggestions!`,
            'info'
          )
        }
      }
    } catch (err) {
      console.error('AI Helper error:', err)
      showAlert(t('writing.aiHelperFailed', 'AI Assistant Failed'), err.message || 'Failed to process with AI helper.', 'error')
    } finally {
      setAiHelperLoading(false)
    }
  }

  const escapeRegExp = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const applyCorrection = (error) => {
    if (!editorRef.current) return
    const errorText = String(error.error || '')
    if (!errorText) return
    const escaped = escapeRegExp(errorText)
    const pattern = /^\w+$/u.test(errorText) ? new RegExp(`\\b${escaped}\\b`, 'giu') : new RegExp(escaped, 'giu')
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT)
    const textNodes = []
    let combinedText = ''
    let node
    while ((node = walker.nextNode())) {
      const value = node.nodeValue || ''
      textNodes.push({ node, start: combinedText.length, end: combinedText.length + value.length })
      combinedText += value
    }
    pattern.lastIndex = 0
    let occurrence = 0
    let selectedMatch = null
    let match
    while ((match = pattern.exec(combinedText))) {
      if (occurrence === (error.occurrenceIndex || 0)) {
        selectedMatch = { start: match.index, end: match.index + match[0].length }
        break
      }
      occurrence += 1
      if (match[0].length === 0) pattern.lastIndex += 1
    }
    const locate = (offset, isEnd) => {
      for (let index = 0; index < textNodes.length; index += 1) {
        const segment = textNodes[index]
        if ((!isEnd && offset >= segment.start && offset < segment.end)
          || (isEnd && offset > segment.start && offset <= segment.end)
          || (offset === segment.start && segment.start === segment.end)) {
          return { node: segment.node, offset: offset - segment.start }
        }
      }
      return null
    }
    const start = selectedMatch && locate(selectedMatch.start, false)
    const end = selectedMatch && locate(selectedMatch.end, true)
    const selectedRange = start && end ? document.createRange() : null
    if (!selectedRange) return
    selectedRange.setStart(start.node, start.offset)
    selectedRange.setEnd(end.node, end.offset)
    selectedRange.deleteContents()
    selectedRange.insertNode(document.createTextNode(String(error.correction || '')))
    handleEditorInput()
    setSpellErrors(prev => prev.filter((item) => item.correctionId !== error.correctionId))
  }

  const isEditingDraft = Boolean(essayId && status === 'draft')
  const isRevising = status === 'needs_revision'

  return (
    <div className="write-essay-page eduvia-page-container">
      {/* Breadcrumb Navigation */}
      <div className="write-essay__nav-bar">
        <button
          type="button"
          className="write-essay__back-btn"
          onClick={() => navigate('/student/essays?tab=drafts')}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>{t('writing.backToDrafts', 'Back to Essay History & Drafts')}</span>
        </button>
      </div>

      {/* Modern Academic Header */}
      <header className="write-essay__header card-base">
        <div className="write-essay__header-main">
          <div className="write-essay__header-meta">
            <span className="write-essay__editorial-badge">
              <span className="material-symbols-outlined">history_edu</span>
              {t('writing.editorialBadge', 'Academic Writing Studio')}
            </span>
            {isEditingDraft && (
              <span className="write-essay__status-badge write-essay__status-badge--draft">
                <span className="material-symbols-outlined">edit_document</span>
                {t('writing.draftBadge', 'Draft Edition')}
              </span>
            )}
            {isRevising && (
              <span className="write-essay__status-badge write-essay__status-badge--revision">
                <span className="material-symbols-outlined">assignment_late</span>
                {t('writing.revisionAlertTitle', 'Revision Requested')}
              </span>
            )}
          </div>
          <h1 className="text-headline-lg write-essay__header-title">
            {assignmentData
              ? `Assignment: ${assignmentData.title}`
              : isEditingDraft
                ? (title ? `${t('writing.editDraftTitle', 'Edit Essay Draft')}: ${title}` : t('writing.editDraftTitle', 'Edit Essay Draft'))
                : t('writing.newEssayTitle', 'Smart Writing Lab')}
          </h1>
          <p className="text-body-md write-essay__header-sub">
            {assignmentData
              ? `Writing for class: ${assignmentData.classId?.name || 'your class'}`
              : isEditingDraft
                ? t('writing.editDraftSubtitle', 'Continue refining your draft before submitting for comprehensive AI evaluation.')
                : t('writing.newEssaySubtitle', 'Compose your essay with real-time AI assistance and vocabulary analysis.')}
          </p>
        </div>

        <div className="write-essay__actions">
          <button
            type="button"
            className="btn-secondary write-essay__action-btn"
            onClick={handleSaveDraft}
            disabled={saving || isAssignmentClosed}
            title={t('writing.saveDraft', 'Save Draft')}
          >
            <span className={`material-symbols-outlined ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'progress_activity' : 'bookmark'}
            </span>
            <span>{saving ? t('writing.saving', 'Saving...') : t('writing.saveDraft', 'Save Draft')}</span>
          </button>
          <button
            type="button"
            className="btn-primary write-essay__action-btn"
            onClick={handleSubmit}
            disabled={saving || isAssignmentClosed}
            title={t('writing.submitEssay', 'Submit for AI Evaluation')}
          >
            <span className={`material-symbols-outlined ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'progress_activity' : 'send'}
            </span>
            <span>{saving ? t('writing.submitting', 'Submitting...') : t('writing.submitEssay', 'Submit for AI Evaluation')}</span>
          </button>
        </div>
      </header>

      {/* Revision Notice Banner */}
      {isRevising && (
        <div className="write-essay__revision-banner">
          <span className="material-symbols-outlined write-essay__revision-icon">assignment_late</span>
          <div>
            <h4 className="text-title-md write-essay__revision-title">{t('writing.revisionAlertTitle', 'Revision Requested by Teacher')}</h4>
            <p className="text-body-sm write-essay__revision-desc">
              {t('writing.revisionAlertDesc', 'You are currently updating an essay that your teacher has requested you to revise. Please address their revision comments.')}
            </p>
          </div>
        </div>
      )}

      {/* Closed Assignment Alert */}
      {isAssignmentClosed && (
        <div className="write-essay__closed-banner">
          <span className="material-symbols-outlined">lock</span>
          <div>
            <strong>{t('writing.closedAssignmentTitle', 'Assignment Closed')}:</strong>{' '}
            {t('writing.closedAssignmentDesc', 'This assignment has been closed by your teacher (or is past due). Submissions and edits are no longer accepted.')}
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="write-essay__layout">
        {/* Editor Column */}
        <div className="write-essay__editor-column">
          {/* Metadata Card: Title & Class */}
          <div className="card-base write-essay__meta-card">
            <div className="write-essay__title-field">
              <label className="text-label-md write-essay__label">
                <span className="material-symbols-outlined write-essay__label-icon">title</span>
                {t('writing.titleLabel', 'Essay Title')}
              </label>
              <input
                type="text"
                className="write-essay__title-input"
                placeholder={t('writing.titlePlaceholder', 'Enter your essay title...')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="write-essay__class-field">
              <label className="text-label-md write-essay__label">
                <span className="material-symbols-outlined write-essay__label-icon">school</span>
                {t('writing.classLabel', 'Assigned Class')} {assignmentData ? t('writing.lockedByAssignment', '(Locked by Assignment)') : ''}
              </label>
              {assignmentData ? (
                <div className="write-essay__locked-class">
                  <span className="material-symbols-outlined">lock</span>
                  <span>{assignmentData.classId?.name || 'Assigned class'}</span>
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="write-essay__select"
                >
                  <option value="">{t('writing.noClass', 'Independent (No Class)')}</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Editorial Canvas Card */}
          <div className="card-base write-essay__editor-card">
            {/* Toolbar */}
            <div className="write-essay__toolbar">
              <div className="write-essay__tool-group">
                <button
                  type="button"
                  className="write-essay__tool-btn"
                  onClick={() => applyFormat('bold')}
                  title="Bold (Ctrl+B)"
                >
                  <span className="material-symbols-outlined">format_bold</span>
                </button>
                <button
                  type="button"
                  className="write-essay__tool-btn"
                  onClick={() => applyFormat('italic')}
                  title="Italic (Ctrl+I)"
                >
                  <span className="material-symbols-outlined">format_italic</span>
                </button>
                <button
                  type="button"
                  className="write-essay__tool-btn"
                  onClick={() => applyFormat('underline')}
                  title="Underline (Ctrl+U)"
                >
                  <span className="material-symbols-outlined">format_underlined</span>
                </button>
              </div>

              <div className="write-essay__tool-separator" />

              <div className="write-essay__tool-group">
                <button
                  type="button"
                  className="write-essay__tool-btn"
                  onClick={() => applyFormat('bullet')}
                  title="Bullet List"
                >
                  <span className="material-symbols-outlined">format_list_bulleted</span>
                </button>
                <button
                  type="button"
                  className="write-essay__tool-btn"
                  onClick={() => applyFormat('number')}
                  title="Numbered List"
                >
                  <span className="material-symbols-outlined">format_list_numbered</span>
                </button>
                <button
                  type="button"
                  className="write-essay__tool-btn"
                  onClick={() => applyFormat('quote')}
                  title="Blockquote"
                >
                  <span className="material-symbols-outlined">format_quote</span>
                </button>
              </div>

              <div className="write-essay__tool-separator" />

              {/* AI Helper Tools */}
              <div className="write-essay__ai-tools">
                <button
                  type="button"
                  className="write-essay__ai-tool-btn"
                  onClick={() => handleAIHelper('spellcheck')}
                  disabled={aiHelperLoading}
                  title={t('writing.aiSpellcheck', 'Grammar & Spelling Check')}
                >
                  <span className="material-symbols-outlined">spellcheck</span>
                  <span>{t('writing.aiSpellcheck', 'Grammar Check')}</span>
                </button>
                <button
                  type="button"
                  className="write-essay__ai-tool-btn write-essay__ai-tool-btn--accent"
                  onClick={() => handleAIHelper('improve')}
                  disabled={aiHelperLoading}
                  title={t('writing.aiImprove', 'AI Style Enhance')}
                >
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  <span>{t('writing.aiImprove', 'Style Enhance')}</span>
                </button>
                {aiHelperLoading && (
                  <div className="write-essay__ai-status">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>{t('writing.aiProcessing', 'AI is analyzing...')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notebook ContentEditable Canvas */}
            <div
              ref={editorRef}
              className="write-essay__canvas"
              contentEditable="true"
              onInput={handleEditorInput}
              onPaste={handlePaste}
              placeholder={t('writing.editorPlaceholder', 'Start writing your essay here (minimum 50 words for AI analysis)...')}
            />

            {/* Dynamic Status Footer */}
            <footer className="write-essay__editor-footer">
              <div className="write-essay__word-indicator">
                <span className="material-symbols-outlined">edit_note</span>
                <span className="text-data-mono write-essay__word-count">{wordCount}</span>
                <span className="text-label-sm">{t('writing.wordCount', 'Words')}</span>
                {wordCount < 50 ? (
                  <span className="write-essay__word-target-badge write-essay__word-target-badge--low">
                    {t('writing.minWordsNote', 'Write at least 50 words to unlock AI feedback')}
                  </span>
                ) : (
                  <span className="write-essay__word-target-badge write-essay__word-target-badge--good">
                    {language === 'vi' ? 'Đủ điều kiện chấm AI' : 'Eligible for AI Grading'}
                  </span>
                )}
              </div>

              <div className="write-essay__autosave-indicator">
                <span className="write-essay__pulse-dot" />
                <span className="text-label-sm">
                  {lastSavedAt
                    ? `${t('writing.autosavedAt', 'Auto-saved at')} ${lastSavedAt.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US')}`
                    : (language === 'vi' ? 'Sẵn sàng lưu bản nháp' : 'Ready to save draft')}
                </span>
              </div>
            </footer>
          </div>
        </div>

        {/* Sidebar Column */}
        <aside className="write-essay__sidebar">
          {/* AI Grammar & Spellcheck Review Panel */}
          {spellErrors.length > 0 && (
            <div className="card-base write-essay__side-card write-essay__side-card--errors">
              <div className="write-essay__side-header">
                <h3 className="text-title-md write-essay__side-title write-essay__side-title--error">
                  <span className="material-symbols-outlined">spellcheck</span>
                  <span>{t('writing.aiSpellcheck', 'Grammar & Spelling')} ({spellErrors.length})</span>
                </h3>
              </div>
              <div className="write-essay__errors-list">
                {spellErrors.map((err, idx) => (
                  <div key={err.correctionId || idx} className="write-essay__error-item">
                    <div className="write-essay__error-diff">
                      <span className="write-essay__error-wrong">{err.error}</span>
                      <span className="material-symbols-outlined write-essay__error-arrow">arrow_forward</span>
                      <span className="write-essay__error-correct">{err.correction}</span>
                    </div>
                    {err.explanation && (
                      <p className="text-body-sm write-essay__error-expl">{err.explanation}</p>
                    )}
                    <button
                      type="button"
                      className="btn-secondary write-essay__apply-btn"
                      onClick={() => applyCorrection(err)}
                    >
                      <span className="material-symbols-outlined">done</span>
                      <span>{t('writing.applySuggestion', 'Apply Suggestion')}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Brief Card (if assignment) */}
          {assignmentData && (
            <div className="card-base write-essay__side-card write-essay__side-card--primary">
              <div className="write-essay__side-header">
                <h3 className="text-title-md write-essay__side-title">
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>assignment</span>
                  <span>{assignmentData.title}</span>
                </h3>
              </div>
              {assignmentData.description && (
                <p className="text-body-sm write-essay__brief-desc">{assignmentData.description}</p>
              )}
              {assignmentData.dueDate && (
                <div className="write-essay__brief-meta">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <span>
                    Due: {new Date(assignmentData.dueDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
              )}
              {assignmentData.keywords?.length > 0 && (
                <div className="write-essay__keywords">
                  <span className="text-label-sm write-essay__keywords-label">Keywords</span>
                  <div className="write-essay__keywords-wrap">
                    {assignmentData.keywords.map((kw, i) => (
                      <span key={i} className="write-essay__keyword-pill">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Selection & AI Topics */}
          <div className="card-base write-essay__side-card">
            <div className="write-essay__side-header">
              <h3 className="text-title-md write-essay__side-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>category</span>
                <span>{t('writing.themeLabel', 'Select Theme')}</span>
              </h3>
            </div>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="write-essay__select write-essay__select--theme"
            >
              {themesList.map((th) => (
                <option key={th.value} value={th.value}>{th.label}</option>
              ))}
            </select>

            <div className="write-essay__topics-header">
              <span className="text-label-md write-essay__topics-title">
                {t('writing.aiTopics', 'AI Suggested Topics')}
              </span>
              {topicsLoading && (
                <span className="material-symbols-outlined animate-spin write-essay__loading-icon">sync</span>
              )}
            </div>

            {topicsLoading ? (
              <div className="write-essay__topics-loading">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span className="text-body-sm">{t('writing.aiGeneratingTopics', 'AI is generating topics...')}</span>
              </div>
            ) : (
              <div className="write-essay__topics-list">
                {topicSuggestions.length === 0 ? (
                  <p className="text-body-sm write-essay__topics-empty">{t('writing.noTopics', 'No topic suggestions found.')}</p>
                ) : (
                  topicSuggestions.map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`write-essay__topic-item ${selectedTopic === topic ? 'write-essay__topic-item--active' : ''}`}
                      onClick={() => {
                        setSelectedTopic(topic)
                        setTitle(topic)
                      }}
                      title={topic}
                    >
                      <span className="material-symbols-outlined">lightbulb</span>
                      <span>{topic}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Writing Metrics Card */}
          <div className="card-base write-essay__side-card">
            <div className="write-essay__side-header">
              <h3 className="text-title-md write-essay__side-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>analytics</span>
                <span>{t('writing.writingStats', 'Writing Metrics')}</span>
              </h3>
            </div>
            <div className="write-essay__metrics-grid">
              <div className="write-essay__metric-item">
                <span className="text-label-sm write-essay__metric-label">{t('writing.paragraphs', 'Paragraphs')}</span>
                <span className="text-data-mono write-essay__metric-value">
                  {essayText.split('\n\n').filter(Boolean).length || (essayText.trim() ? 1 : 0)}
                </span>
              </div>
              <div className="write-essay__metric-item">
                <span className="text-label-sm write-essay__metric-label">{t('writing.sentences', 'Sentences')}</span>
                <span className="text-data-mono write-essay__metric-value">
                  {essayText.split(/[.!?]+/).filter(Boolean).length || 0}
                </span>
              </div>
              <div className="write-essay__metric-item">
                <span className="text-label-sm write-essay__metric-label">{t('writing.characterCount', 'Characters')}</span>
                <span className="text-data-mono write-essay__metric-value">{essayText.length}</span>
              </div>
              <div className="write-essay__metric-item">
                <span className="text-label-sm write-essay__metric-label">{t('writing.readingTime', 'Reading Time')}</span>
                <span className="text-data-mono write-essay__metric-value">
                  {Math.max(1, Math.ceil(wordCount / 200))} {t('common.min', 'min')}
                </span>
              </div>
            </div>
          </div>

          {/* Writing Tips / Guidelines Card */}
          <div className="card-base write-essay__side-card">
            <div className="write-essay__side-header">
              <h3 className="text-title-md write-essay__side-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>tips_and_updates</span>
                <span>{t('writing.writingTips', 'IELTS Writing Guidelines')}</span>
              </h3>
            </div>
            <ul className="write-essay__tips-list">
              <li>
                <span className="material-symbols-outlined write-essay__tip-icon">check_circle</span>
                <span>{t('writing.tip1', 'Vary your vocabulary to increase your lexical diversity (TTR) score.')}</span>
              </li>
              <li>
                <span className="material-symbols-outlined write-essay__tip-icon">check_circle</span>
                <span>{t('writing.tip2', 'Use clear cohesive devices and topic sentences for each paragraph.')}</span>
              </li>
              <li>
                <span className="material-symbols-outlined write-essay__tip-icon">check_circle</span>
                <span>{t('writing.tip3', 'Aim for at least 150–250 words for comprehensive AI grading.')}</span>
              </li>
              <li>
                <span className="material-symbols-outlined write-essay__tip-icon">check_circle</span>
                <span>{t('writing.tip4', 'Review AI grammar and spelling suggestions before submitting.')}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
