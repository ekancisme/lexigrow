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
      onConfirm: () => closeModal()
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
        closeModal()
        if (onConfirm) onConfirm()
      },
      onCancel: () => {
        closeModal()
        if (onCancel) onCancel()
      }
    })
  }

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
    if (modalConfig.type === 'confirm' && modalConfig.onCancel) {
      modalConfig.onCancel()
    }
  }

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
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
