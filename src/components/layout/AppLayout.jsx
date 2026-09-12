import { useState, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import ParentBottomNav from './ParentBottomNav'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ChatWidget from '../chat/ChatWidget'
import './AppLayout.css'

// Routes that need full-bleed layout (no padding, no max-width)
const FULL_BLEED_ROUTES = [
  '/student/vocabulary/review',
]

export default function AppLayout({ role, children }) {
  const { user, selectedParentChildId } = useAuth()
  const resolvedRole = role || user?.role || 'student'
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isFullBleed = FULL_BLEED_ROUTES.some(r => location.pathname.startsWith(r))
  const storedChildIsValid = user?.children?.some(child => child._id === selectedParentChildId)
  const selectedChildId = location.pathname.match(/^\/parent\/children\/([^/]+)/)?.[1]
    || (storedChildIsValid ? selectedParentChildId : '')
    || user?.children?.[0]?._id
    || ''

  return (
    <div className="app-layout">
      <Sidebar
        role={resolvedRole}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      {mobileMenuOpen && (
        <button
          className="app-layout__sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="app-layout__main">
        <TopNav role={resolvedRole} onMenuToggle={() => setMobileMenuOpen(open => !open)} />
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
      </div>
      {resolvedRole === 'parent' && (
        <ParentBottomNav childId={selectedChildId} onMore={() => setMobileMenuOpen(true)} />
      )}
      <ChatWidget />
    </div>
  )
}
