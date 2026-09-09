import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ParentBottomNav.css'

export default function ParentBottomNav({ childId, onMore }) {
  const { t } = useLanguage()

  const items = [
    { icon: 'dashboard', label: t('nav.overview', 'Overview'), path: '/parent/dashboard' },
    { icon: 'monitoring', label: t('nav.progress', 'Progress'), path: childId ? `/parent/children/${childId}/progress` : '/parent/dashboard', childRequired: true },
    { icon: 'history_edu', label: t('nav.essays', 'Essays'), path: childId ? `/parent/children/${childId}/essays` : '/parent/dashboard', childRequired: true },
    { icon: 'warning', label: t('nav.alerts', 'Alerts'), path: childId ? `/parent/children/${childId}/alerts` : '/parent/dashboard', childRequired: true },
  ]

  return (
    <nav className="parent-bottom-nav" aria-label="Parent mobile navigation">
      {items.map(item => (
        <NavLink
          key={item.label}
          to={item.path}
          className={({ isActive }) => `parent-bottom-nav__item ${isActive ? 'is-active' : ''} ${item.childRequired && !childId ? 'is-disabled' : ''}`}
          onClick={event => {
            if (item.childRequired && !childId) event.preventDefault()
          }}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button type="button" className="parent-bottom-nav__item" onClick={onMore}>
        <span className="material-symbols-outlined">more_horiz</span>
        <span>{t('common.more', 'More')}</span>
      </button>
    </nav>
  )
}
