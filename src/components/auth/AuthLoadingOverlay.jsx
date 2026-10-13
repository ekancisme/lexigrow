import { createPortal } from 'react-dom'
import './AuthLoadingOverlay.css'

export default function AuthLoadingOverlay({ title, description }) {
  return createPortal(
    <div className="auth-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="auth-loading__card">
        <div className="auth-loading__loader" aria-hidden="true">
          {'Loading'.split('').map((letter, index) => (
            <span className="auth-loading__letter" style={{ '--letter-index': index }} key={`${letter}-${index}`}>
              {letter}
            </span>
          ))}
          <span className="auth-loading__ring" />
        </div>
        <strong className="auth-loading__title">{title}</strong>
        <p className="auth-loading__description">{description}</p>
      </div>
    </div>,
    document.body,
  )
}
