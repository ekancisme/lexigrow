import React from 'react'
import './Select.css'
import './Input.css' // Reuses .lexi-field label/error styles

export default function Select({
  label,
  helperText,
  error,
  options = [],
  children,
  className = '',
  id,
  disabled = false,
  ...rest
}) {
  const selectId = id || (label ? `lexi-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className="lexi-field">
      {label && (
        <label htmlFor={selectId} className="lexi-field__label">
          {label}
        </label>
      )}
      <div className="lexi-select-wrapper">
        <select
          id={selectId}
          disabled={disabled}
          className={`lexi-select ${error ? 'lexi-input--error' : ''} ${className}`}
          {...rest}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span className="material-symbols-outlined lexi-select__chevron" aria-hidden="true" style={{ fontSize: 20 }}>
          expand_more
        </span>
      </div>
      {error ? (
        <span className="lexi-field__error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className="lexi-field__helper">{helperText}</span>
      ) : null}
    </div>
  )
}
