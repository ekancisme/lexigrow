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
        const trigger = headerRef.current?.querySelector('.navigation-disclosure.is-open > button')
        setDisclosure(current => ({ ...current, id: null }))
        trigger?.focus()
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
  const searchLabel = role === 'teacher' ? t('header.searchStudent') : t('header.searchEssay')
  const searchInput = (
    <form className="topnav__search-field" onSubmit={(e) => {
      e.preventDefault()
      const val = e.currentTarget.searchQuery?.value?.trim()
      if (val) {
        navigate(`/student/explore?q=${encodeURIComponent(val)}`)
        closeNavigation()
      }
    }}>
      <input
        name="searchQuery"
        type="search"
        aria-label={searchLabel}
        placeholder={language === 'vi' ? 'Tìm kiếm khóa học, bài học...' : 'Search for course...'}
      />
      <button type="submit" className="topnav__search-submit" aria-label="Search">
        <span className="material-symbols-outlined" aria-hidden="true">search</span>
      </button>
    </form>
  )

  const isHome = location.pathname === '/' || location.pathname === '/student/home'

  return (
    <header ref={headerRef} className={`topnav ${isHome ? 'topnav--home' : ''}`} onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) {
        event.preventDefault()
        onMenuClose()
        setOpenId(null)
        menuButtonRef.current?.focus()
      }
    }}>
      <div className="topnav__bar">
        <Link to={role === 'student' ? '/student/home' : `/${role}/dashboard`} className="topnav__brand" onClick={closeNavigation} aria-label={t('headerNavigation.homeLabel')}>
          <span className="topnav__brand-mark">
            <img src="/assets/brand/lexigrow-emblem.png" alt="" width="32" height="32" className="topnav__brand-img" />
          </span>
          <span className="topnav__brand-name">LexiGrow</span>
        </Link>
        <NavigationDisclosure
          className="topnav__browse-disclosure"
          triggerLabel={language === 'vi' ? 'Khám phá' : 'Browse'}
          label={
            <span className="topnav__browse-btn-text">
              <span>{language === 'vi' ? 'Khám phá' : 'Browse'}</span>
              <span className="material-symbols-outlined topnav__chevron-icon">expand_more</span>
            </span>
          }
          open={openId === 'browse'}
          onOpen={() => setOpenId('browse')}
          onClose={() => setOpenId(current => current === 'browse' ? null : current)}
          onToggle={() => setOpenId(current => current === 'browse' ? null : 'browse')}
        >
          <ul className="header-navigation__links">
            <li>
              <Link to="/student/explore" className="header-navigation__link" onClick={closeNavigation}>
                <span className="material-symbols-outlined">recommend</span>
                <span>All Recommendation</span>
              </Link>
            </li>
            <li>
              <Link to="/student/explore?q=illustrator" className="header-navigation__link" onClick={closeNavigation}>
                <span className="material-symbols-outlined">draw</span>
                <span>Adobe Illustrator</span>
              </Link>
            </li>
            <li>
              <Link to="/student/explore?q=photoshop" className="header-navigation__link" onClick={closeNavigation}>
                <span className="material-symbols-outlined">palette</span>
                <span>Adobe Photoshop</span>
              </Link>
            </li>
            <li>
              <Link to="/student/explore?q=design" className="header-navigation__link" onClick={closeNavigation}>
                <span className="material-symbols-outlined">design_services</span>
                <span>UI Design</span>
              </Link>
            </li>
            <li>
              <Link to="/student/explore?q=web" className="header-navigation__link" onClick={closeNavigation}>
                <span className="material-symbols-outlined">code</span>
                <span>Web Programming & Vue JS</span>
              </Link>
            </li>
            <li>
              <Link to="/student/explore?q=writing" className="header-navigation__link" onClick={closeNavigation}>
                <span className="material-symbols-outlined">history_edu</span>
                <span>Academic Writing</span>
              </Link>
            </li>
          </ul>
        </NavigationDisclosure>
        <div className="topnav__center-search">
          {searchInput}
        </div>
        <div id="topnav-main-navigation" className={`topnav__navigation ${menuOpen ? 'is-open' : ''}`}>
          <HeaderNavigation role={role} openId={openId} setOpenId={setOpenId} onNavigate={closeNavigation} />
          <div className="topnav__mobile-tools">
            {searchInput}
            {!user && (
              <div className="topnav__mobile-auth">
                <Link to="/login" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">login</span>
                  <span>{t('auth.loginBtn', 'Đăng nhập')}</span>
                </Link>
                <Link to="/register" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
                  <span>{language === 'vi' ? 'Đăng ký tài khoản' : 'Sign Up'}</span>
                </Link>
              </div>
            )}
            <button type="button" className="header-navigation__link" onClick={toggleTheme}>
              <span className="material-symbols-outlined" aria-hidden="true">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
              {theme === 'light' ? t('header.themeDark') : t('header.themeLight')}
            </button>
          </div>
        </div>
        <div className="topnav__actions">
          <Link to="/teacher/dashboard" className="topnav__instructor-link" title={language === 'vi' ? 'Trở thành Giảng viên' : 'Become Instructor'}>
            <span className="topnav__instructor-text">{language === 'vi' ? 'Trở thành Giảng viên' : 'Become Instructor'}</span>
          </Link>
          <Link to="/student/dashboard" className="topnav__icon-btn topnav__cart-btn" title={language === 'vi' ? 'Giỏ hàng' : 'Cart'}>
            <span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span>
          </Link>
          <LanguageSwitcher />
          <button type="button" className="topnav__icon-btn topnav__theme-btn" onClick={toggleTheme}
            aria-label={theme === 'light' ? t('header.themeDark') : t('header.themeLight')}
            title={theme === 'light' ? t('header.themeDark') : t('header.themeLight')}>
            <span className="material-symbols-outlined" aria-hidden="true">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          </button>
          {user ? (
            <>
              <NotificationBell />
              <NavigationDisclosure className="topnav__account" align="end" triggerLabel={t('headerNavigation.account')}
                label={<>{user?.avatar ? <img src={user.avatar} alt="" className="topnav__avatar topnav__avatar--image" /> : <span className="topnav__avatar" aria-hidden="true">{user?.name?.trim()?.[0]?.toUpperCase() || 'L'}</span>}<span className="topnav__account-label">{t('headerNavigation.account')}</span></>}
                open={openId === 'account'} onOpen={() => setOpenId('account')}
                onClose={() => setOpenId(current => current === 'account' ? null : current)}
                onToggle={() => setOpenId(current => current === 'account' ? null : 'account')}>
                <Link to="/profile" className="topnav__account-summary" onClick={closeNavigation}>
                  <strong>{user?.name || t('headerNavigation.account')}</strong>
                  <p>{subtitle}</p>
                </Link>
                <Link to="/profile" className="header-navigation__link" onClick={closeNavigation}><span className="material-symbols-outlined" aria-hidden="true">person</span>{t('nav.profile', 'Profile')}</Link>
                <Link to="/settings" className="header-navigation__link" onClick={closeNavigation}><span className="material-symbols-outlined" aria-hidden="true">settings</span>{t('nav.settings')}</Link>
                {role !== 'admin' && <Link to="/pricing" className="header-navigation__link" onClick={closeNavigation}>
                  <span className="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
                  {tierInfo?.tier && tierInfo.tier !== 'free'
                    ? <span>{t('headerNavigation.currentPlan', { tier: tierInfo.tier.toUpperCase() })}{tierInfo.source === 'teacher_sponsored' && <small>{tierInfo.planName || t('headerNavigation.sponsoredPlan')}</small>}</span>
                    : role === 'teacher' ? t('nav.teacherPlans') : t('nav.upgradePlan')}
                </Link>}
                <button type="button" className="header-navigation__link topnav__logout" onClick={() => { closeNavigation(); logout(); navigate('/login') }}>
                  <span className="material-symbols-outlined" aria-hidden="true">logout</span>{t('nav.logout')}
                </button>
              </NavigationDisclosure>
            </>
          ) : (
            <div className="topnav__auth-group">
              <Link to="/login" className="topnav__btn-outline" onClick={closeNavigation}>
                <span>{language === 'vi' ? 'Đăng nhập' : 'Login'}</span>
              </Link>
              <Link to="/register" className="topnav__btn-primary" onClick={closeNavigation}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>explore</span>
                <span>{language === 'vi' ? 'Đăng ký' : 'Sign Up'}</span>
              </Link>
            </div>
          )}
          <button ref={menuButtonRef} type="button" className="topnav__icon-btn topnav__menu-btn" onClick={() => { setOpenId(null); onMenuToggle() }}
            aria-label={menuOpen ? t('headerNavigation.closeMenu') : t('headerNavigation.openMenu')}
            aria-expanded={menuOpen} aria-controls="topnav-main-navigation">
            <span className="material-symbols-outlined" aria-hidden="true">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
