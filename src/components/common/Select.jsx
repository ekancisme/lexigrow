import { useId } from 'react'
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
  const generatedId = useId()
  const fallbackId = `lexi-select-${generatedId.replace(/:/g, '')}`
  const selectId = id || fallbackId

  const errorId = error ? `${selectId}-error` : undefined
  const helperId = helperText ? `${selectId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

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
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
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
        <span id={errorId} className="lexi-field__error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="lexi-field__helper">{helperText}</span>
      ) : null}
    </div>
  )
}
