import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import NotificationBell from '../common/NotificationBell.jsx'
import LanguageSwitcher from '../common/LanguageSwitcher.jsx'
import { paymentService } from '../../services/payment.service.js'
import HeaderNavigation from './HeaderNavigation.jsx'
import NavigationDisclosure from './NavigationDisclosure.jsx'
import './TopNav.css'

export default function TopNav({ role = 'student', menuOpen, onMenuToggle, onMenuClose }) {
  const [tierInfo, setTierInfo] = useState(null)
  const [disclosure, setDisclosure] = useState({ id: null, route: null })
  const headerRef = useRef(null)
  const menuButtonRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, language } = useLanguage()

  const openId = disclosure.route === location.key ? disclosure.id : null
  const setOpenId = next => setDisclosure(current => ({
    id: typeof next === 'function' ? next(current.route === location.key ? current.id : null) : next,
    route: location.key,
  }))
  const closeNavigation = () => { setOpenId(null); onMenuClose() }

  useEffect(() => {
    let current = true
    if (user && user.role !== 'admin') {
      paymentService.getMySubscription().then(res => {
        if (current) setTierInfo(res?.success && res?.data ? res.data : res?.tier ? res : null)
      }).catch(() => {})
    }
    return () => { current = false }
  }, [user])

  useEffect(() => {
    if (!menuOpen) return undefined
    const dismiss = event => { if (!headerRef.current?.contains(event.target)) onMenuClose() }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [menuOpen, onMenuClose])

  useEffect(() => {
    if (!openId && !menuOpen) return undefined
    const dismissWithEscape = event => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (openId) {
        setDisclosure(current => ({ ...current, id: null }))
      } else {
        onMenuClose()
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', dismissWithEscape)
    return () => document.removeEventListener('keydown', dismissWithEscape)
  }, [openId, menuOpen, onMenuClose])

  const subtitle = role === 'teacher'
    ? user?.institution || t('header.educator')
    : role === 'parent'
      ? user?.children?.length
        ? t('headerNavigation.parentOf', { names: user.children.map(child => child.name).filter(Boolean).join(', ') })
        : t('header.parent')
      : role === 'admin' ? t('headerNavigation.administrator') : `${t('header.student')} (${user?.englishLevel || '—'})`

  const isHome = location.pathname === '/' || location.pathname === '/student/home'

  return (
    <header ref={headerRef} className={`topnav ${isHome ? 'topnav--home' : ''}`}>
      <div className="topnav__bar">
        {/* 1. Brand Logo (Left) */}
        <Link
          to={role === 'student' ? '/student/home' : `/${role}/dashboard`}
          className="topnav__brand"
          onClick={closeNavigation}
          aria-label={t('headerNavigation.homeLabel')}
        >
          <span className="topnav__brand-mark">
            <img
              src="/assets/brand/lexigrow-emblem.png"
              alt=""
              width="32"
              height="32"
              className="topnav__brand-img"
            />
          </span>
          <span className="topnav__brand-name">LexiGrow</span>
        </Link>

        {/* 2. Main Navigation (Moved to Right, search bar removed) */}
        <div id="topnav-main-navigation" className={`topnav__navigation ${menuOpen ? 'is-open' : ''}`}>
          <HeaderNavigation role={role} openId={openId} setOpenId={setOpenId} onNavigate={closeNavigation} />
          <div className="topnav__mobile-tools">
            {!user && (
              <div className="topnav__mobile-auth">
                <Link to="/login" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">login</span>
                  <span>{language === 'vi' ? 'Đăng nhập' : 'Login'}</span>
                </Link>
                <Link to="/register" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
                  <span>{language === 'vi' ? 'Đăng ký' : 'Sign Up'}</span>
                </Link>
              </div>
            )}
            <div className="topnav__mobile-row">
              <LanguageSwitcher />
              <button type="button" className="header-navigation__link" onClick={toggleTheme}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {theme === 'light' ? 'dark_mode' : 'light_mode'}
                </span>
                <span>{theme === 'light' ? t('header.themeDark') : t('header.themeLight')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Right Actions Bar */}
        <div className="topnav__actions">
          {user ? (
            <>
              <NotificationBell />
              <NavigationDisclosure
                className="topnav__account"
                align="end"
                triggerLabel={t('headerNavigation.account')}
                label={
                  <img
                    src={user?.avatar || '/assets/editorial/user-avatar.png'}
                    alt={user?.name || 'User'}
                    className="topnav__avatar topnav__avatar--image"
                  />
                }
                open={openId === 'account'}
                onOpen={() => setOpenId('account')}
                onClose={() => setOpenId(current => current === 'account' ? null : current)}
                onToggle={() => setOpenId(current => current === 'account' ? null : 'account')}
              >
                <Link to="/profile" className="topnav__account-summary" onClick={closeNavigation}>
                  <strong>{user?.name || t('headerNavigation.account')}</strong>
                  <p>{subtitle}</p>
                </Link>
                <Link to="/student/dashboard" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">school</span>
                  <span>{language === 'vi' ? 'Khoá học của tôi' : 'My Courses'}</span>
                </Link>
                <Link to="/profile" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">person</span>
                  <span>{t('nav.profile', 'Profile')}</span>
                </Link>
                <Link to="/settings" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">settings</span>
                  <span>{t('nav.settings')}</span>
                </Link>
                {role !== 'admin' && (
                  <Link to="/pricing" className="header-navigation__link" onClick={closeNavigation}>
                    <span className="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
                    {tierInfo?.tier && tierInfo.tier !== 'free' ? (
                      <span>
                        {t('headerNavigation.currentPlan', { tier: tierInfo.tier.toUpperCase() })}
                        {tierInfo.source === 'teacher_sponsored' && (
                          <small>{tierInfo.planName || t('headerNavigation.sponsoredPlan')}</small>
                        )}
                      </span>
                    ) : (
                      <span>{language === 'vi' ? 'Bảng giá & Nâng cấp' : (role === 'teacher' ? t('nav.teacherPlans') : t('nav.upgradePlan'))}</span>
                    )}
                  </Link>
                )}
                <button
                  type="button"
                  className="header-navigation__link"
                  onClick={() => { toggleTheme(); }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {theme === 'light' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span>{theme === 'light' ? t('header.themeDark') : t('header.themeLight')}</span>
                </button>
                <div className="topnav__dropdown-lang-row">
                  <span className="material-symbols-outlined" aria-hidden="true">translate</span>
                  <LanguageSwitcher />
                </div>
                <button
                  type="button"
                  className="header-navigation__link topnav__logout"
                  onClick={() => { closeNavigation(); logout(); navigate('/login') }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                  <span>{t('nav.logout')}</span>
                </button>
              </NavigationDisclosure>
            </>
          ) : (
            <div className="topnav__auth-group">
              <LanguageSwitcher />
              <Link to="/login" className="topnav__btn-outline" onClick={closeNavigation}>
                <span>{language === 'vi' ? 'Đăng nhập' : 'Login'}</span>
              </Link>
              <Link to="/register" className="topnav__btn-primary" onClick={closeNavigation}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>explore</span>
                <span>{language === 'vi' ? 'Đăng ký' : 'Sign Up'}</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu button (ONLY on <= 1024px) */}
          <button
            ref={menuButtonRef}
            type="button"
            className="topnav__icon-btn topnav__menu-btn"
            onClick={() => { setOpenId(null); onMenuToggle() }}
            aria-label={menuOpen ? t('headerNavigation.closeMenu') : t('headerNavigation.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="topnav-main-navigation"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
