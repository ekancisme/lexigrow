import { useState, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import ParentBottomNav from './ParentBottomNav'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ChatWidget from '../chat/ChatWidget'
import AnnouncementPopup from '../common/AnnouncementPopup.jsx'
import SiteFooter from './SiteFooter.jsx'
import './AppLayout.css'

// Routes that need full-bleed layout (no padding, no max-width)
const FULL_BLEED_ROUTES = [
  '/student/home',
  '/student/explore',
  '/courses',
  '/course',
  '/about',
  '/teachers',
  '/testimonials',
  '/help',
  '/faq',
  '/contact',
  '/pricing',
  '/404',
  '/student/vocabulary/review',
]

export default function AppLayout({ role, children }) {
  const { user, selectedParentChildId } = useAuth()
  const resolvedRole = role || user?.role || 'student'
  const location = useLocation()
  const [mobileMenuRoute, setMobileMenuRoute] = useState(null)
  const mobileMenuOpen = mobileMenuRoute === location.key

  const isFullBleed = FULL_BLEED_ROUTES.some(r => location.pathname.startsWith(r))
  const storedChildIsValid = user?.children?.some(child => child._id === selectedParentChildId)
  const selectedChildId = location.pathname.match(/^\/parent\/children\/([^/]+)/)?.[1]
    || (storedChildIsValid ? selectedParentChildId : '')
    || user?.children?.[0]?._id
    || ''

  return (
    <div className="app-layout eduvia-refresh" data-role={resolvedRole}>
      <div className="app-layout__main">
        <TopNav role={resolvedRole} menuOpen={mobileMenuOpen}
          onMenuToggle={() => setMobileMenuRoute(current => current === location.key ? null : location.key)}
          onMenuClose={() => setMobileMenuRoute(null)} />
        <main className={`app-layout__content${isFullBleed ? ' app-layout__content--no-padding' : ''}${resolvedRole === 'parent' ? ' app-layout__content--parent' : ''}`}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36, color: 'var(--color-primary)' }}>
                progress_activity
              </span>
            </div>
          }>
            {children || <Outlet />}
          </Suspense>
        </main>
        <SiteFooter />
      </div>
      {resolvedRole === 'parent' && (
        <ParentBottomNav childId={selectedChildId} onMore={() => setMobileMenuRoute(location.key)} />
      )}
      <ChatWidget />
      {user && <AnnouncementPopup role={resolvedRole} userId={user._id || user.id} />}
    </div>
  )
}
