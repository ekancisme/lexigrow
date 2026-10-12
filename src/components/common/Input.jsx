import React, { forwardRef } from 'react'
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
  const inputId = id || (label ? `lexi-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

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
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...rest}
        />
        {rightIcon && (
          <span className="material-symbols-outlined lexi-field__right-icon" aria-hidden="true" style={{ fontSize: 18 }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="lexi-field__error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-helper`} className="lexi-field__helper">
          {helperText}
        </span>
      ) : null}
    </div>
  )
})

export default Input
