import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import NotificationBell from '../common/NotificationBell.jsx'
import { paymentService } from '../../services/payment.service.js'
import './TopNav.css'

export default function TopNav({ role = 'student', onMenuToggle }) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [tierInfo, setTierInfo] = useState(null)
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (authUser && authUser.role !== 'admin') {
      paymentService.getMySubscription()
        .then(res => {
          if (res?.success && res?.data) {
            setTierInfo(res.data)
          } else if (res?.tier) {
            setTierInfo(res)
          }
        })
        .catch(() => {
          // ignore or fallback
        })
    }
  }, [authUser])

  const user = authUser
    ? {
        name: authUser.name,
        subtitle: authUser.role === 'teacher'
          ? authUser.institution || 'Educator'
          : authUser.role === 'parent'
            ? authUser.children && authUser.children.length > 0
              ? `Parent of ${authUser.children.map(c => c.name).filter(Boolean).join(', ')}`
              : 'Parent'
            : `Student (${authUser.englishLevel || 'N/A'})`
      }
    : {
        name: role === 'teacher' ? 'Prof. Elena' : (role === 'parent' ? 'Parent User' : 'Alex Rivera'),
        subtitle: role === 'teacher' ? 'Senior Educator' : (role === 'parent' ? 'Parent' : 'Student (C1 Level)')
      }

  return (
    <header className="topnav">
      <button className="topnav__menu-btn" onClick={onMenuToggle} aria-label="Open navigation menu">
        <span className="material-symbols-outlined">menu</span>
      </button>
      {role === 'parent' ? (
        <div className="topnav__parent-context">
          <span className="material-symbols-outlined">family_restroom</span>
          <div><strong>Parent workspace</strong><span>Family learning overview</span></div>
        </div>
      ) : (
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
      )}

      {/* Right Actions */}
      <div className="topnav__actions">
        {/* Subscription Tier Badge / Upgrade CTA */}
        {authUser && authUser.role !== 'admin' && (
          <div className="topnav__tier-container">
            {tierInfo?.tier && tierInfo.tier !== 'free' ? (
              <button
                className={`topnav__tier-badge topnav__tier-badge--${tierInfo.tier} ${tierInfo.source === 'teacher_sponsored' ? 'topnav__tier-badge--sponsored' : ''}`}
                onClick={() => navigate('/pricing')}
                title={tierInfo.source === 'teacher_sponsored' ? tierInfo.planName : `${tierInfo.tier.toUpperCase()} Plan`}
              >
                <span className="material-symbols-outlined">
                  {tierInfo.tier === 'ultra' ? 'workspace_premium' : tierInfo.tier === 'pro' ? 'star' : tierInfo.source === 'teacher_sponsored' ? 'school' : 'bolt'}
                </span>
                <span>
                  {tierInfo.tier.toUpperCase()}
                  {tierInfo.source === 'teacher_sponsored' && ' (Teacher)'}
                </span>
              </button>
            ) : (
              <button className="topnav__upgrade-btn" onClick={() => navigate('/pricing')}>
                <span className="material-symbols-outlined">rocket_launch</span>
                <span>Upgrade</span>
              </button>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button className="topnav__icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Notifications */}
        <NotificationBell />

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
