import { useEffect, useId, useRef } from 'react'

// Native disclosure navigation: links retain their normal Tab order.
export default function NavigationDisclosure({ label, children, open, onOpen, onClose, onToggle, active = false, align = 'start', className = '', triggerClassName = '', triggerLabel }) {
  const id = useId()
  const root = useRef(null)
  const trigger = useRef(null)
  const panel = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const dismiss = event => { if (!root.current?.contains(event.target)) onClose() }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, onClose])
  return (
    <div ref={root} className={`navigation-disclosure ${open ? 'is-open' : ''} ${active ? 'is-active' : ''} ${className}`}
      onPointerEnter={event => { if (event.pointerType === 'mouse') onOpen() }}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !root.current?.contains(document.activeElement)) onClose() }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onClose() }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); onClose(); trigger.current?.focus() }
      }}>
      <button ref={trigger} type="button" className={`navigation-disclosure__trigger ${triggerClassName}`}
        aria-label={triggerLabel} aria-expanded={open} aria-controls={id} onClick={onToggle}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            onOpen()
            const last = event.key === 'ArrowUp'
            requestAnimationFrame(() => {
              const nodes = panel.current?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])')
              if (nodes?.length) nodes[last ? nodes.length - 1 : 0].focus()
            })
          }
        }}>
        {label}<span className="material-symbols-outlined navigation-disclosure__chevron" aria-hidden="true">expand_more</span>
      </button>
      <div id={id} ref={panel} hidden={!open} className={`navigation-disclosure__panel navigation-disclosure__panel--${align}`}>
        <div className="navigation-disclosure__surface">{children}</div>
      </div>
    </div>
  )
}
