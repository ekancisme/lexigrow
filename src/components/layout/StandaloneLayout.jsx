import SiteFooter from './SiteFooter.jsx'

export default function StandaloneLayout({ children }) {
  return <div className="standalone-layout eduvia-refresh">{children}<SiteFooter /></div>
}
