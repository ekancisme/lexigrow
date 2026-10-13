import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ContactUsPage.css'

const CONTACT_ADDRESS = '55 Lê Thiện Trị, Ngũ Hành Sơn, Đà Nẵng'
const CONTACT_PHONE = '0335247117'

export default function ContactUsPage() {
  const { t } = useLanguage()
  const [sent, setSent] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    subject: '',
    message: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(formData.subject || t('contact.emailSubject'))
    const body = encodeURIComponent([
      `${t('contact.nameLabel')}: ${formData.name}`,
      `${t('contact.emailFieldLabel')}: ${formData.email}`,
      `${t('contact.roleLabel')}: ${t(`contact.role${formData.role[0].toUpperCase()}${formData.role.slice(1)}`)}`,
      '',
      formData.message,
    ].join('\n'))
    window.location.href = `mailto:support@lexigrow.com?subject=${subject}&body=${body}`
    setSent(true)
    setTimeout(() => setSent(false), 8000)
  }

  const FAQS = [
    {
      q: t('contact.faq1Q'),
      a: t('contact.faq1A'),
    },
    {
      q: t('contact.faq2Q'),
      a: t('contact.faq2A'),
    },
    {
      q: t('contact.faq3Q'),
      a: t('contact.faq3A'),
    },
    {
      q: t('contact.faq4Q'),
      a: t('contact.faq4A'),
    },
    {
      q: t('contact.faq5Q'),
      a: t('contact.faq5A'),
    },
    {
      q: t('contact.faq6Q'),
      a: t('contact.faq6A'),
    },
  ]

  return (
    <div className="eduvia-page eduvia-contact-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">{t('contact.heroTitle')}</h1>
          <p className="eduvia-page-header__desc">
            {t('contact.heroDesc')}
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">{t('contact.breadcrumbHome')}</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>{t('contact.breadcrumbContact')}</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: CONNECT WITH OUR SUPPORT TEAM ── */}
        <section className="eduvia-support-connect">
          <div className="eduvia-support-connect__info">
            <span className="eduvia-kicker eduvia-kicker--green">{t('contact.supportKicker')}</span>
            <h2 className="eduvia-section-title">{t('contact.supportTitle')}</h2>
            <p className="eduvia-section-desc">
              {t('contact.supportDesc')}
            </p>

            <div className="eduvia-contact-info-list">
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">mail</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.emailLabel')}</span>
                  <a href="mailto:support@lexigrow.com"><strong>support@lexigrow.com</strong></a>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">location_on</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.addressLabel')}</span>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_ADDRESS)}`} target="_blank" rel="noreferrer"><strong>{t('contact.addressValue')}</strong></a>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">call</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.phoneLabel')}</span>
                  <a href={`tel:${CONTACT_PHONE}`}><strong>{CONTACT_PHONE}</strong></a>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">schedule</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.hoursLabel')}</span>
                  <strong>{t('contact.hoursValue')}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="eduvia-support-connect__form-wrap">
            <form className="eduvia-connect-form" onSubmit={handleSubmit}>
              {sent && (
                <div className="eduvia-form-success" role="status">
                  {t('contact.emailDraftMsg')}
                </div>
              )}
              <div className="eduvia-form-group">
                <label htmlFor="contact-name">{t('contact.nameLabel')}</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder={t('contact.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-email">{t('contact.emailFieldLabel')}</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder={t('contact.emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-role">{t('contact.roleLabel')}</label>
                <select
                  id="contact-role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="student">{t('contact.roleStudent')}</option>
                  <option value="teacher">{t('contact.roleTeacher')}</option>
                  <option value="parent">{t('contact.roleParent')}</option>
                </select>
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-subject">{t('contact.subjectLabel')}</label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder={t('contact.subjectPlaceholder')}
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-message">{t('contact.messageLabel')}</label>
                <textarea
                  id="contact-message"
                  rows="4"
                  placeholder={t('contact.messagePlaceholder')}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="eduvia-btn eduvia-btn--lime eduvia-btn--block">
                {t('contact.submitBtn')}
              </button>
            </form>
          </div>
        </section>

        {/* ── SECTION 2: MAP VIEW ── */}
        <section className="eduvia-map-section" aria-label={t('contact.mapLabel')}>
          <div className="eduvia-map-container">
            <iframe
              title={t('contact.mapTitle')}
              src={`https://www.google.com/maps?q=${encodeURIComponent(CONTACT_ADDRESS)}&output=embed`}
              width="100%"
              height="450"
              style={{ border: 0, borderRadius: '24px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* ── SECTION 3: FAQS (6 COMPREHENSIVE LEXIGROW ITEMS) ── */}
        <section className="eduvia-faqs-section">
          <div className="eduvia-section-header" id="contact-faqs">
            <div>
              <span className="eduvia-kicker eduvia-kicker--green">{t('contact.faqsKicker')}</span>
              <h2 className="eduvia-section-title">{t('contact.faqsTitle')}</h2>
            </div>
            <Link to="/pricing" className="eduvia-btn eduvia-btn--mint">
              {t('contact.viewPricing')}
            </Link>
          </div>

          <div className="eduvia-faqs-grid">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="eduvia-faq-card">
                <span className="eduvia-faq-arrow material-symbols-outlined">subdirectory_arrow_right</span>
                <div className="eduvia-faq-card__body">
                  <h3 className="eduvia-faq-card__q">{faq.q}</h3>
                  <p className="eduvia-faq-card__a">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
