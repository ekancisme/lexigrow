import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './AppLayout.css'

// Routes that need full-bleed layout (no padding, no max-width)
const FULL_BLEED_ROUTES = [
  '/student/vocabulary/review',
]

export default function AppLayout({ role }) {
  const { user } = useAuth()
  const resolvedRole = role || user?.role || 'student'
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isFullBleed = FULL_BLEED_ROUTES.some(r => location.pathname.startsWith(r))

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
        <main className={`app-layout__content${isFullBleed ? ' app-layout__content--no-padding' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
