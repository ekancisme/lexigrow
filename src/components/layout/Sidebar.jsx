import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './Sidebar.css'

export default function Sidebar({ role = 'student', mobileOpen = false, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user, selectedParentChildId, selectParentChild } = useAuth()
  const { t } = useLanguage()

  const studentNavItems = [
    { icon: 'home', label: t('nav.today', 'Today'), path: '/student/dashboard' },
    { icon: 'explore', label: t('nav.explore', 'Explore'), path: '/student/explore' },
    { icon: 'edit_note', label: t('nav.smartWriting', 'Smart Writing'), path: '/student/writing' },
    { icon: 'menu_book', label: t('nav.myWords', 'My Words'), path: '/student/my-words' },
    { icon: 'school', label: t('nav.myClasses', 'My Classes'), path: '/student/class' },
    { icon: 'forest', label: t('nav.growthGarden', 'Growth Garden'), path: '/student/progress' },
    { icon: 'workspace_premium', label: t('nav.upgradePlan', 'Upgrade Plan'), path: '/pricing' },
  ]

  const teacherNavItems = [
    { icon: 'dashboard', label: t('nav.dashboard', 'Dashboard'), path: '/teacher/dashboard' },
    { icon: 'school', label: t('nav.myClasses', 'My Classes'), path: '/teacher/classes' },
    { icon: 'assignment', label: t('nav.assignments', 'Assignments'), path: '/teacher/assignments' },
    { icon: 'warning', label: t('nav.earlyWarnings', 'Early Warnings'), path: '/teacher/alerts' },
    { icon: 'smart_toy', label: t('nav.systemPrompts', 'System Prompts'), path: '/teacher/prompts' },
    { icon: 'workspace_premium', label: t('nav.teacherPlans', 'Teacher Plans'), path: '/pricing' },
  ]

  const adminNavItems = [
    { icon: 'dashboard', label: t('nav.dashboard', 'Dashboard'), path: '/admin/dashboard' },
    { icon: 'group', label: t('nav.users', 'Users'), path: '/admin/users' },
    { icon: 'domain', label: t('nav.classes', 'Classes'), path: '/admin/classes' },
    { icon: 'payments', label: t('nav.pricingPayOS', 'Pricing & PayOS'), path: '/admin/pricing' },
    { icon: 'monitoring', label: t('nav.aiMonitoring', 'AI Monitoring'), path: '/admin/ai-monitoring' },
    { icon: 'dictionary', label: t('nav.vocabulary', 'Vocabulary'), path: '/admin/vocabulary' },
    { icon: 'receipt_long', label: t('nav.auditLogs', 'Audit Logs'), path: '/admin/logs' },
  ]

  const bottomItems = [
    { icon: 'settings', label: t('nav.settings', 'Settings'), path: '/settings' },
  ]

  const routeChildId = location.pathname.match(/^\/parent\/children\/([^/]+)/)?.[1]
  const storedChildIsValid = user?.children?.some(child => child._id === selectedParentChildId)
  const selectedChildId = routeChildId || (storedChildIsValid ? selectedParentChildId : '') || user?.children?.[0]?._id || ''
  const selectedChild = user?.children?.find(child => child._id === selectedChildId)

  const parentNavItems = [
    { icon: 'dashboard', label: t('nav.overview', 'Overview'), path: '/parent/dashboard' },
    { icon: 'monitoring', label: t('nav.progress', 'Progress'), path: selectedChildId ? `/parent/children/${selectedChildId}/progress` : '/parent/dashboard', childRequired: true },
    { icon: 'history_edu', label: t('nav.essays', 'Essays'), path: selectedChildId ? `/parent/children/${selectedChildId}/essays` : '/parent/dashboard', childRequired: true },
    { icon: 'menu_book', label: t('nav.vocabulary', 'Vocabulary'), path: selectedChildId ? `/parent/children/${selectedChildId}/vocabulary` : '/parent/dashboard', childRequired: true },
    { icon: 'flag', label: t('nav.weeklyGoals', 'Weekly Goals'), path: selectedChildId ? `/parent/children/${selectedChildId}/goals` : '/parent/dashboard', childRequired: true },
    { icon: 'warning', label: t('nav.alerts', 'Alerts'), path: selectedChildId ? `/parent/children/${selectedChildId}/alerts` : '/parent/dashboard', childRequired: true, badge: selectedChild?.unreadAlertCount },
  ]

  const navItems = role === 'admin'
    ? adminNavItems
    : (role === 'teacher' ? teacherNavItems : (role === 'parent' ? parentNavItems : studentNavItems))

  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand" onClick={() => { navigate(`/${role}/dashboard`); onClose?.() }}>
        <div className="sidebar__logo">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_stories
          </span>
        </div>
        <div>
          <h1 className="sidebar__title">LexiGrow</h1>
          <p className="sidebar__subtitle">{t('nav.measuredGrowth', 'Measured Growth')}</p>
        </div>
        <button
          className="sidebar__mobile-close"
          aria-label="Close navigation menu"
          onClick={(event) => { event.stopPropagation(); onClose?.() }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {role === 'parent' && user?.children?.length > 0 && (
        <div className="sidebar__child-switcher">
          <label htmlFor="sidebar-child-select">{t('nav.viewingStudent', 'Viewing student')}</label>
          <div className="sidebar__child-select-wrap">
            <span className="material-symbols-outlined">school</span>
            <select
              id="sidebar-child-select"
              value={selectedChildId}
              onChange={(event) => {
                const nextChildId = event.target.value
                selectParentChild(nextChildId)
                const currentView = location.pathname.match(/^\/parent\/children\/[^/]+\/(progress|essays|vocabulary|goals|alerts)$/)?.[1] || 'progress'
                navigate(`/parent/children/${nextChildId}/${currentView}`)
                onClose?.()
              }}
            >
              {user.children.map(child => (
                <option key={child._id} value={child._id}>{child.name}</option>
              ))}
            </select>
          </div>
          {selectedChild && (
            <p>{selectedChild.englishLevel || 'Level not set'}{selectedChild.activeAlertCount ? ` · ${selectedChild.activeAlertCount} active alert${selectedChild.activeAlertCount === 1 ? '' : 's'}` : ' · On track'}</p>
          )}
        </div>
      )}

      {/* Main Nav */}
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''} ${item.childRequired && !selectedChildId ? 'sidebar__link--disabled' : ''}`
            }
            onClick={(event) => {
              if (item.childRequired && !selectedChildId) event.preventDefault()
              else onClose?.()
            }}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="sidebar__link-label">{item.label}</span>
            {item.badge > 0 && <span className="sidebar__badge">{item.badge > 9 ? '9+' : item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* CTA Button */}
      {role === 'parent' && (
        <div className="sidebar__cta">
          <button
            className="sidebar__cta-btn"
            onClick={() => { navigate('/parent/dashboard?link=1'); onClose?.() }}
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>{t('nav.linkStudent', 'Link Student')}</span>
          </button>
        </div>
      )}
      {role !== 'parent' && role !== 'admin' && (
        <div className="sidebar__cta">
          <button
            className="sidebar__cta-btn"
            onClick={() =>
              { navigate(role === 'student' ? '/student/writing' : '/teacher/classes'); onClose?.() }
            }
          >
            <span className="material-symbols-outlined">add</span>
            <span>{role === 'student' ? t('nav.newEntry', 'New Entry') : t('nav.newClass', 'New Class')}</span>
          </button>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="sidebar__bottom">
        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            onClick={onClose}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button className="sidebar__link sidebar__logout" onClick={() => { logout(); navigate('/login'); }}>
          <span className="material-symbols-outlined">logout</span>
          <span>{t('nav.logout', 'Logout')}</span>
        </button>
      </div>
    </aside>
  )
}
