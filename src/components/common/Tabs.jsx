import React from 'react'
import './Tabs.css'

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
  ariaLabel = 'Navigation tabs'
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`lexi-tabs-nav lexi-tabs-nav--${variant} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            className={`lexi-tab--${variant} ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange && onChange(tab.id)}
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
