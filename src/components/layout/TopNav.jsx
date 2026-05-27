import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import './TopNav.css'

export default function TopNav({ role = 'student' }) {
  const [searchFocused, setSearchFocused] = useState(false)
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const user = authUser
    ? { name: authUser.name, subtitle: authUser.role === 'teacher' ? authUser.institution || 'Educator' : `Student (${authUser.englishLevel || 'N/A'})` }
    : { name: role === 'teacher' ? 'Prof. Elena' : 'Alex Rivera', subtitle: role === 'teacher' ? 'Senior Educator' : 'Student (C1 Level)' }

  return (
    <header className="topnav">
      {/* Search Bar */}
      <div className={`topnav__search ${searchFocused ? 'topnav__search--focused' : ''}`}>
        <span className="material-symbols-outlined topnav__search-icon">search</span>
        <input
          type="text"
          className="topnav__search-input"
          placeholder={role === 'teacher' ? 'Search students or metrics...' : 'Search essays or vocabulary...'}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right Actions */}
      <div className="topnav__actions">
        {/* Theme Toggle */}
        <button className="topnav__icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Notifications */}
        <button className="topnav__icon-btn" aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="topnav__badge"></span>
        </button>

        {/* User Profile */}
        <div className="topnav__profile" onClick={() => navigate('/settings')}>
          <div className="topnav__profile-info">
            <p className="topnav__profile-name">{user.name}</p>
            <p className="topnav__profile-role">{user.subtitle}</p>
          </div>
          <div className="topnav__avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </div>
    </header>
  )
}
