import React, { createContext, useContext, useState, useEffect } from 'react'
import Modal from '../components/common/Modal.jsx'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  })

  useEffect(() => {
    const originalAlert = window.alert
    window.alert = (message) => {
      showAlert('Notification', String(message))
    }
    return () => {
      window.alert = originalAlert
    }
  }, [])

  const showAlert = (title, message, type = 'info') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null
    })
  }

  const showConfirm = (title, message, onConfirm, onCancel) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }))
        if (onConfirm) onConfirm()
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }))
        if (onCancel) onCancel()
      }
    })
  }

  // closeModal ONLY closes the dialog. It never invokes a callback, so any
  // caller (X, backdrop, Escape) must go through handleCancel when a cancel
  // callback is expected.
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  // Cancel path used by the X button, backdrop click, Escape and Cancel button.
  const handleCancel = () => {
    const onCancel = modalConfig.onCancel
    closeModal()
    if (onCancel) onCancel()
  }

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={handleCancel}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within ModalProvider')
  return context
}
