import { useState, useEffect, useRef } from 'react'
import api from '../../services/api.js'
import './TextTranslator.css'

export default function TextTranslator() {
  const [selectionInfo, setSelectionInfo] = useState(null) // { text: '', x: 0, y: 0 }
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleMouseUp = (e) => {
      // If click is inside our translator container, ignore it to prevent close or re-trigger
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return
      }

      // Small delay to allow window.getSelection() to register
      setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection.toString().trim()

        // Hide translation if text is too short or too long
        if (!selectedText || selectedText.length < 2 || selectedText.length > 500) {
          if (!isOpen) {
            setSelectionInfo(null)
          }
          return
        }

        try {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()

          // Position trigger bubble above selection
          setSelectionInfo({
            text: selectedText,
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY - 8,
          })
          setIsOpen(false) // Close modal/popover, show only button first
          setTranslation('')
        } catch (err) {
          console.error('Error getting selection range:', err)
        }
      }, 50)
    }

    const handleMouseDown = (e) => {
      // If clicking outside the translator component, close it
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSelectionInfo(null)
        setIsOpen(false)
        setTranslation('')
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isOpen])

  const handleTranslate = async () => {
    if (!selectionInfo || !selectionInfo.text) return

    try {
      setLoading(true)
      setIsOpen(true)
      const res = await api.post('/essays/translate', { text: selectionInfo.text })
      if (res.success) {
        setTranslation(res.translation)
      } else {
        setTranslation('Failed to translate.')
      }
    } catch (err) {
      console.error('Translation error:', err)
      setTranslation('Error: ' + (err.message || 'Server error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSpeak = () => {
    if ('speechSynthesis' in window && selectionInfo?.text) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(selectionInfo.text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSelectionInfo(null)
    setIsOpen(false)
    setTranslation('')
    // Clear actual browser selection
    window.getSelection()?.removeAllRanges()
  }

  if (!selectionInfo) return null

  return (
    <div 
      className="text-trans" 
      style={{ left: `${selectionInfo.x}px`, top: `${selectionInfo.y}px` }}
      ref={containerRef}
    >
      {!isOpen ? (
        // Floating Bubble Translate Trigger Button
        <button 
          className="text-trans__trigger animate-scale-in"
          onClick={handleTranslate}
          title="Translate to Vietnamese"
        >
          <span className="material-symbols-outlined">g_translate</span>
        </button>
      ) : (
        // Translation Modal Box
        <div className="text-trans__modal animate-scale-in card-base">
          <div className="text-trans__modal-header">
            <span className="text-trans__title-badge">Translation</span>
            <div className="text-trans__header-actions">
              <button className="text-trans__action-btn" onClick={handleSpeak} title="Listen">
                <span className="material-symbols-outlined">volume_up</span>
              </button>
              <button className="text-trans__action-btn text-trans__close" onClick={handleClose}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="text-trans__modal-body">
            <div className="text-trans__text-block text-trans__text-block--original">
              <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Original Text</p>
              <p className="text-body-md">"{selectionInfo.text}"</p>
            </div>
            
            <hr className="text-trans__divider" />

            <div className="text-trans__text-block text-trans__text-block--translation">
              <p className="text-label-sm" style={{ color: 'var(--color-primary)' }}>Vietnamese</p>
              {loading ? (
                <div className="text-trans__loading">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Translating via AI...</span>
                </div>
              ) : (
                <p className="text-body-md text-trans__result">{translation}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
