import React, { useEffect, useId, useRef } from 'react'
import './Modal.css'

// Track nested modals so the body scroll lock is released only once
let bodyLockCount = 0
let savedBodyOverflow = ''

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'warning' | 'error' | 'confirm'
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}) {
  const wrapperRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const typeRef = useRef(type)
  const titleId = useId()

  // Keep latest callbacks/props in refs so the effect below does not re-run every render
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    typeRef.current = type
  }, [type])

  // Body scroll lock (nested-safe) + focus trap + Escape handling + focus restore
  useEffect(() => {
    if (!isOpen) return undefined

    previouslyFocusedRef.current = document.activeElement

    if (bodyLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    bodyLockCount += 1

    const wrapper = wrapperRef.current
    const primaryBtn = wrapper ? wrapper.querySelector('.modal-btn--primary') : null
    const firstFocusable = wrapper ? wrapper.querySelector(FOCUSABLE_SELECTOR) : null
    const initialFocus = primaryBtn || firstFocusable
    if (initialFocus) initialFocus.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Confirm dialogs force an explicit choice, so Escape must not dismiss them
        if (typeRef.current !== 'confirm') {
          e.stopPropagation()
          if (onCloseRef.current) onCloseRef.current()
        }
        return
      }

      if (e.key !== 'Tab' || !wrapper) return

      const nodes = Array.from(wrapper.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      )
      if (nodes.length === 0) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first || !wrapper.contains(document.activeElement)) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last || !wrapper.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      bodyLockCount -= 1
      if (bodyLockCount <= 0) {
        bodyLockCount = 0
        document.body.style.overflow = savedBodyOverflow
      }
      const previous = previouslyFocusedRef.current
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      case 'confirm':
        return 'help'
      case 'info':
      default:
        return 'info'
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else if (onClose) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-wrapper"
        ref={wrapperRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Top Bar */}
        <div className={`modal-header-accent modal-header-accent--${type}`} />

        {/* Modal Body */}
        <div className="modal-body">
          <div className={`modal-icon-container modal-icon-container--${type}`}>
            <span className="material-symbols-outlined modal-icon" aria-hidden="true">
              {getIcon()}
            </span>
          </div>
          {title && <h3 className="modal-title" id={titleId}>{title}</h3>}
          {message && <p className="modal-message">{message}</p>}
        </div>

        {/* Modal Footer Buttons */}
        <div className="modal-footer">
          {type === 'confirm' && (
            <button
              type="button"
              className="modal-btn modal-btn--secondary"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className="modal-btn modal-btn--primary"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}