import { forwardRef, useId } from 'react'
import './Input.css'

const Input = forwardRef(function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  type = 'text',
  disabled = false,
  ...rest
}, ref) {
  const generatedId = useId()
  const fallbackId = `lexi-input-${generatedId.replace(/:/g, '')}`
  const inputId = id || (label ? `lexi-input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : fallbackId)

  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText ? `${inputId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  const inputClasses = [
    'lexi-input',
    leftIcon ? 'lexi-input--has-left-icon' : '',
    rightIcon ? 'lexi-input--has-right-icon' : '',
    error ? 'lexi-input--error' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="lexi-field">
      {label && (
        <label htmlFor={inputId} className="lexi-field__label">
          {label}
        </label>
      )}
      <div className="lexi-field__wrapper">
        {leftIcon && (
          <span className="material-symbols-outlined lexi-field__left-icon" aria-hidden="true" style={{ fontSize: 18 }}>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
        {rightIcon && (
          <span className="material-symbols-outlined lexi-field__right-icon" aria-hidden="true" style={{ fontSize: 18 }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error ? (
        <span id={errorId} className="lexi-field__error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="lexi-field__helper">
          {helperText}
        </span>
      ) : null}
    </div>
  )
})

export default Input
