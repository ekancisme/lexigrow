import React from 'react'
import './Card.css'

export default function Card({
  children,
  className = '',
  padding = 'md',
  elevated = false,
  interactive = false,
  onClick,
  ...rest
}) {
  const classes = [
    'lexi-card',
    `lexi-card--pad-${padding}`,
    elevated ? 'lexi-card--elevated' : '',
    interactive ? 'lexi-card--interactive' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} onClick={onClick} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...rest }) {
  return (
    <div className={`lexi-card__header ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ children, subtitle, className = '', ...rest }) {
  return (
    <div className={className} {...rest}>
      <h3 className="lexi-card__title">{children}</h3>
      {subtitle && <p className="lexi-card__subtitle">{subtitle}</p>}
    </div>
  )
}

export function CardFooter({ children, className = '', ...rest }) {
  return (
    <div className={`lexi-card__footer ${className}`} {...rest}>
      {children}
    </div>
  )
}
