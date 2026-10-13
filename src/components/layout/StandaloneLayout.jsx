import SiteFooter from './SiteFooter.jsx'
import './StandaloneLayout.css'

export default function StandaloneLayout({ children }) {
  return <div className="standalone-layout eduvia-refresh">{children}<SiteFooter /></div>
}
