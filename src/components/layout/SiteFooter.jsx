import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './SiteFooter.css'

export default function SiteFooter() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <footer className="site-footer" aria-label={t('siteFooter.label')}>
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <Link to="/student/home" className="site-footer__brand">
            <img src="/assets/brand/lexigrow-emblem.png" alt="" width="28" height="28" />
            <span>LexiGrow</span>
          </Link>
          <p>{t('siteFooter.tagline')}</p>
        </div>

        <nav className="site-footer__links" aria-label={t('siteFooter.navigation')}>
          <div className="site-footer__group">
            <h2>{t('siteFooter.learnHeading')}</h2>
            <Link to="/student/home">{t('siteFooter.home')}</Link>
            <Link to="/pricing">{t('siteFooter.pricing')}</Link>
          </div>
          <div className="site-footer__group">
            <h2>{t('siteFooter.accountHeading')}</h2>
            {user
              ? <Link to="/settings">{t('siteFooter.settings')}</Link>
              : <>
                <Link to="/login">{t('siteFooter.login')}</Link>
                <Link to="/register">{t('siteFooter.register')}</Link>
              </>}
          </div>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} LexiGrow</span>
        <span>{t('siteFooter.rights')}</span>
      </div>
    </footer>
  )
}
