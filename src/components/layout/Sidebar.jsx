import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './Sidebar.css'

const studentNavItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/student/dashboard' },
  { icon: 'school', label: 'My Class', path: '/student/class' },
  { icon: 'edit_note', label: 'Write Essay', path: '/student/write-essay' },
  { icon: 'history', label: 'Essay History', path: '/student/essays' },
  { icon: 'menu_book', label: 'Vocabulary', path: '/student/vocabulary' },
  { icon: 'trending_up', label: 'My Progress', path: '/student/progress' },
  { icon: 'flag', label: 'Weekly Goals', path: '/student/goals' },
  { icon: 'psychology', label: 'AI Feedback', path: '/student/feedback' },
]

const teacherNavItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/teacher/dashboard' },
  { icon: 'school', label: 'My Classes', path: '/teacher/classes' },
  { icon: 'warning', label: 'Early Warnings', path: '/teacher/alerts' },
  { icon: 'smart_toy', label: 'System Prompts', path: '/teacher/prompts' },
]

const parentNavItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/parent/dashboard' },
]

const adminNavItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: 'group', label: 'Users', path: '/admin/users' },
  { icon: 'domain', label: 'Classes', path: '/admin/classes' },
  { icon: 'monitoring', label: 'AI Monitoring', path: '/admin/ai-monitoring' },
  { icon: 'dictionary', label: 'Vocabulary', path: '/admin/vocabulary' },
  { icon: 'receipt_long', label: 'Audit Logs', path: '/admin/logs' },
]

const bottomItems = [
  { icon: 'settings', label: 'Settings', path: '/settings' },
]

export default function Sidebar({ role = 'student', mobileOpen = false, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
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
          <p className="sidebar__subtitle">Measured Growth</p>
        </div>
        <button
          className="sidebar__mobile-close"
          aria-label="Close navigation menu"
          onClick={(event) => { event.stopPropagation(); onClose?.() }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
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
      </nav>

      {/* CTA Button */}
      {role !== 'parent' && role !== 'admin' && (
        <div className="sidebar__cta">
          <button
            className="sidebar__cta-btn"
            onClick={() =>
              { navigate(role === 'student' ? '/student/write-essay' : '/teacher/classes'); onClose?.() }
            }
          >
            <span className="material-symbols-outlined">add</span>
            <span>{role === 'student' ? 'New Entry' : 'New Class'}</span>
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
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
