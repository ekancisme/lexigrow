import './Badge.css'

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...rest
}) {
  const classes = [
    'lexi-badge',
    `lexi-badge--${variant}`,
    `lexi-badge--${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classes} {...rest}>
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: size === 'sm' ? 12 : 14 }} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}
