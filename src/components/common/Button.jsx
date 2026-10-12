import React from 'react'
import './Button.css'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const classes = [
    'lexi-btn',
    `lexi-btn--${variant}`,
    `lexi-btn--${size}`,
    fullWidth ? 'lexi-btn--full' : '',
    disabled || loading ? 'is-disabled' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <span className="lexi-btn__spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="material-symbols-outlined" style={{ fontSize: size === 'sm' ? 16 : 18 }} aria-hidden="true">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="material-symbols-outlined" style={{ fontSize: size === 'sm' ? 16 : 18 }} aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  )
}
