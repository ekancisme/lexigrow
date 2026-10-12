import './Card.css'

export default function Card({
  children,
  className = '',
  padding = 'md',
  elevated = false,
  interactive = false,
  onClick,
  onKeyDown,
  ...rest
}) {
  const isInteractive = interactive || Boolean(onClick)
  const classes = [
    'lexi-card',
    `lexi-card--pad-${padding}`,
    elevated ? 'lexi-card--elevated' : '',
    isInteractive ? 'lexi-card--interactive' : '',
    className
  ].filter(Boolean).join(' ')

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e)
      return
    }
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick || onKeyDown ? handleKeyDown : undefined}
      {...rest}
    >
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
