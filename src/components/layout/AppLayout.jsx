import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import './AppLayout.css'

export default function AppLayout({ role = 'student' }) {
  return (
    <div className="app-layout">
      <Sidebar role={role} />
      <div className="app-layout__main">
        <TopNav role={role} />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
