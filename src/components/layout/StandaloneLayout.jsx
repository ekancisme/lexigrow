import SiteFooter from './SiteFooter.jsx'

export default function StandaloneLayout({ children }) {
  return <div className="standalone-layout">{children}<SiteFooter /></div>
}
