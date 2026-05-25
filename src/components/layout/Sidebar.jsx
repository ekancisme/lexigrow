import { NavLink, useNavigate } from 'react-router-dom'
import './Sidebar.css'

const studentNavItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/student/dashboard' },
  { icon: 'edit_note', label: 'Write Essay', path: '/student/write-essay' },
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

const bottomItems = [
  { icon: 'settings', label: 'Settings', path: '/settings' },
  { icon: 'help', label: 'Help Center', path: '#' },
]

export default function Sidebar({ role = 'student' }) {
  const navigate = useNavigate()
  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand" onClick={() => navigate(`/${role}/dashboard`)}>
        <div className="sidebar__logo">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_stories
          </span>
        </div>
        <div>
          <h1 className="sidebar__title">LexiGrow</h1>
          <p className="sidebar__subtitle">Measured Growth</p>
        </div>
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
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* CTA Button */}
      <div className="sidebar__cta">
        <button
          className="sidebar__cta-btn"
          onClick={() =>
            navigate(role === 'student' ? '/student/write-essay' : '/teacher/classes')
          }
        >
          <span className="material-symbols-outlined">add</span>
          <span>{role === 'student' ? 'New Entry' : 'New Class'}</span>
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="sidebar__bottom">
        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button className="sidebar__link sidebar__logout" onClick={() => navigate('/login')}>
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
