import { useId, useRef } from 'react'
import './Tabs.css'

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
  ariaLabel = 'Navigation tabs'
}) {
  const normalizedVariant = variant === 'pill' ? 'pills' : variant
  const generatedId = useId().replace(/:/g, '')
  const tabListRef = useRef(null)

  const getTabId = (id) => `${generatedId}-tab-${String(id).replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const getPanelId = (id) => `${generatedId}-tabpanel-${String(id).replace(/[^a-zA-Z0-9_-]/g, '-')}`

  const handleKeyDown = (e, currentIndex) => {
    if (!tabs || tabs.length === 0) return

    let nextIndex = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== null) {
      const nextTab = tabs[nextIndex]
      onChange?.(nextTab.id)
      const nextElem = tabListRef.current?.querySelector(`#${getTabId(nextTab.id)}`)
      nextElem?.focus()
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      ref={tabListRef}
      className={`lexi-tabs-nav lexi-tabs-nav--${normalizedVariant} ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={getPanelId(tab.id)}
            id={getTabId(tab.id)}
            tabIndex={isActive ? 0 : -1}
            className={`lexi-tab--${normalizedVariant} ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange?.(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {tab.icon && (
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: -3 }}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{ marginLeft: 6, opacity: 0.7, fontSize: '0.85em' }}>
                ({tab.count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
