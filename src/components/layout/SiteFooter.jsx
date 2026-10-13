import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './SiteFooter.css'

const CONTACT_ADDRESS = '55 Lê Thiện Trị, Ngũ Hành Sơn, Đà Nẵng'
const CONTACT_PHONE = '0335247117'

export default function SiteFooter() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const homePath = !user || user.role === 'student' ? '/student/home' : `/${user.role}/dashboard`
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_ADDRESS)}`

  return (
    <footer className="eduvia-footer" aria-label={t('siteFooter.label')}>
      <div className="eduvia-footer__inner">
        <div className="eduvia-footer__col eduvia-footer__col--brand">
          <Link to={homePath} className="eduvia-footer__logo" aria-label="LexiGrow">
            <span className="eduvia-footer__logo-mark">
              <img src="/assets/brand/lexigrow-emblem.png" alt="" width="34" height="34" className="eduvia-footer__brand-img" />
            </span>
            <span className="eduvia-footer__logo-text">LexiGrow</span>
          </Link>
          <p className="eduvia-footer__text">{t('siteFooter.tagline')}</p>
          <Link to="/contact" className="eduvia-footer__phone">
            <span className="material-symbols-outlined" aria-hidden="true">support_agent</span>
            <span>{t('siteFooter.contactCta')}</span>
          </Link>
        </div>

        <div className="eduvia-footer__col">
          <h3 className="eduvia-footer__heading">{t('siteFooter.learnHeading')}</h3>
          <ul className="eduvia-footer__links">
            <li><Link to="/student/explore">{t('siteFooter.explore')}</Link></li>
            <li><Link to="/student/vocabulary">{t('siteFooter.vocabulary')}</Link></li>
            <li><Link to="/student/writing">{t('siteFooter.writing')}</Link></li>
            <li><Link to="/student/garden">{t('siteFooter.garden')}</Link></li>
          </ul>
        </div>

        <div className="eduvia-footer__col">
          <h3 className="eduvia-footer__heading">{t('siteFooter.aboutHeading')}</h3>
          <ul className="eduvia-footer__links">
            <li><Link to="/about">{t('siteFooter.about')}</Link></li>
            <li><Link to="/pricing">{t('siteFooter.pricing')}</Link></li>
            <li><Link to="/contact#contact-faqs">{t('siteFooter.faqs')}</Link></li>
            <li><Link to="/contact">{t('siteFooter.contact')}</Link></li>
          </ul>
        </div>

        <div className="eduvia-footer__col eduvia-footer__col--contact">
          <h3 className="eduvia-footer__heading">{t('siteFooter.contactHeading')}</h3>
          <ul className="eduvia-footer__links">
            <li><a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a></li>
            <li><a href="mailto:support@lexigrow.com">support@lexigrow.com</a></li>
            <li><a href={mapsUrl} target="_blank" rel="noreferrer">{t('siteFooter.address')}</a></li>
          </ul>
        </div>
      </div>

      <div className="eduvia-footer__bottom">
        <div className="eduvia-footer__bottom-inner">
          <p className="eduvia-footer__copy-text">
            {t('siteFooter.copyright', { year: new Date().getFullYear() })}
          </p>
          <span>{t('siteFooter.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
