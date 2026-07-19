import React, { useEffect } from 'react'
import './Modal.css'

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
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
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
      <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Accent Top Bar */}
        <div className={`modal-header-accent modal-header-accent--${type}`} />
        
        {/* Modal Body */}
        <div className="modal-body">
          <div className={`modal-icon-container modal-icon-container--${type}`}>
            <span className="material-symbols-outlined modal-icon">
              {getIcon()}
            </span>
          </div>
          {title && <h3 className="modal-title">{title}</h3>}
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
