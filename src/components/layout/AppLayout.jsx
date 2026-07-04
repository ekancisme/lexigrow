import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './AppLayout.css'

export default function AppLayout({ role }) {
  const { user } = useAuth()
  const resolvedRole = role || user?.role || 'student'

  return (
    <div className="app-layout">
      <Sidebar role={resolvedRole} />
      <div className="app-layout__main">
        <TopNav role={resolvedRole} />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
