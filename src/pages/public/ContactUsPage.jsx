import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ContactUsPage.css'

export default function ContactUsPage() {
  const { t, language } = useLanguage()
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
    setSent(true)
    setFormData({ name: '', email: '', role: 'student', subject: '', message: '' })
    setTimeout(() => setSent(false), 5000)
  }

  const FAQS = [
    {
      q: t('contact.faq1Q', 'What is LexiGrow and how does it help improve my English?'),
      a: t('contact.faq1A', 'LexiGrow is an intelligent English learning platform designed to bridge vocabulary memorization and essay writing. Through Spaced Repetition (SRS), AI essay scoring, and contextual exercises, learners build natural language reflexes and retain vocabulary long-term.'),
    },
    {
      q: t('contact.faq2Q', 'How does the Spaced Repetition System (SRS) work?'),
      a: t('contact.faq2A', 'Based on the Ebbinghaus forgetting curve, the platform schedules reviews just as memory begins to decay (1 day, 3 days, 7 days, 16 days, 30 days). Correct answers increase the review interval, while missed words return sooner.'),
    },
    {
      q: t('contact.faq3Q', 'How does the AI writing evaluation score essays?'),
      a: t('contact.faq3A', 'Our AI evaluates your writing against the 4 official IELTS criteria: Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy. It flags grammar slips, suggests B2-C1 synonyms, and provides actionable rewrite suggestions within seconds.'),
    },
    {
      q: t('contact.faq4Q', 'How can Teachers and Parents use LexiGrow?'),
      a: t('contact.faq4A', 'Teachers can create virtual classrooms, assign essays with required vocabulary, and monitor at-risk students via Early Warning Alerts. Parents have a dedicated dashboard to track their child\'s study consistency, weekly milestones, and essay quality in real time.'),
    },
    {
      q: t('contact.faq5Q', 'How does VietQR PayOS payment work?'),
      a: t('contact.faq5A', 'When choosing a subscription, you will see a dynamic VietQR code. Scanning it with any mobile banking app in Vietnam immediately activates your plan via automated webhook within 3 seconds, with zero manual review needed.'),
    },
    {
      q: t('contact.faq6Q', 'Is LexiGrow suitable for absolute beginners (A1-A2)?'),
      a: t('contact.faq6A', 'Yes! LexiGrow provides curated beginner sets with Vietnamese definitions, phonetic guides, example sentences, and bite-sized 60-word writing prompts designed to build confidence without feeling overwhelming.'),
    },
  ]

  return (
    <div className="eduvia-page eduvia-contact-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">{t('contact.heroTitle', 'Contact & Support')}</h1>
          <p className="eduvia-page-header__desc">
            {t('contact.heroDesc', 'Have questions about LexiGrow plans, school integrations, or technical support? Our academic and engineering teams are here to assist.')}
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">{t('contact.breadcrumbHome', 'Home')}</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>{t('contact.breadcrumbContact', 'Contact Us')}</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: CONNECT WITH OUR SUPPORT TEAM ── */}
        <section className="eduvia-support-connect">
          <div className="eduvia-support-connect__info">
            <span className="eduvia-kicker eduvia-kicker--green">{t('contact.supportKicker', 'Get In Touch')}</span>
            <h2 className="eduvia-section-title">{t('contact.supportTitle', 'Connect With The LexiGrow Academic & Support Team')}</h2>
            <p className="eduvia-section-desc">
              {t('contact.supportDesc', 'We provide responsive support for individual learners, school educators, and parents seeking educational guidance.')}
            </p>

            <div className="eduvia-contact-info-list">
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">mail</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.emailLabel', 'Email Inquiries')}</span>
                  <strong>support@lexigrow.com</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">location_on</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.addressLabel', 'Office Location')}</span>
                  <strong>{t('contact.addressValue', 'Hanoi & Ho Chi Minh City, Vietnam')}</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">call</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.phoneLabel', 'Hotline')}</span>
                  <strong>+84 (24) 7300 8888</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">schedule</span></span>
                <div>
                  <span className="eduvia-contact-label">{t('contact.hoursLabel', 'Support Hours')}</span>
                  <strong>{t('contact.hoursValue', 'Monday – Friday (08:00 – 18:00)')}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="eduvia-support-connect__form-wrap">
            <form className="eduvia-connect-form" onSubmit={handleSubmit}>
              {sent && (
                <div className="eduvia-form-success" role="status">
                  {t('contact.successMsg', '✓ Thank you! Your message has been sent. Our team will contact you within 24 hours.')}
                </div>
              )}
              <div className="eduvia-form-group">
                <label htmlFor="contact-name">{t('contact.nameLabel', 'Full Name')}</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder={t('contact.namePlaceholder', 'John Doe')}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-email">{t('contact.emailLabel', 'Email Address')}</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder={t('contact.emailPlaceholder', 'your.email@example.com')}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-role">{t('contact.roleLabel', 'I am a')}</label>
                <select
                  id="contact-role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="student">{t('contact.roleStudent', 'Student / Independent Learner')}</option>
                  <option value="teacher">{t('contact.roleTeacher', 'Teacher / School Representative')}</option>
                  <option value="parent">{t('contact.roleParent', 'Parent')}</option>
                </select>
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-subject">{t('contact.subjectLabel', 'Subject / Topic')}</label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder={t('contact.subjectPlaceholder', 'e.g., Question about Pro Plan, Classroom Setup, etc.')}
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="eduvia-form-group">
                <label htmlFor="contact-message">{t('contact.messageLabel', 'Your Message')}</label>
                <textarea
                  id="contact-message"
                  rows="4"
                  placeholder={t('contact.messagePlaceholder', 'Share your questions or feedback with us...')}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="eduvia-btn eduvia-btn--lime eduvia-btn--block">
                {t('contact.submitBtn', 'Send Message')}
              </button>
            </form>
          </div>
        </section>

        {/* ── SECTION 2: MAP VIEW ── */}
        <section className="eduvia-map-section" aria-label="Location Map">
          <div className="eduvia-map-container">
            <iframe
              title="LexiGrow Learning Center"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119176.45688537443!2d105.74692795820312!3d21.022736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab9bd8161a63%3A0x8714070a73981d33!2sHanoi%2C%20Vietnam!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
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
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--green">{t('contact.faqsKicker', 'System FAQs')}</span>
              <h2 className="eduvia-section-title">{t('contact.faqsTitle', 'Everything You Need To Know About LexiGrow')}</h2>
            </div>
            <Link to="/pricing" className="eduvia-btn eduvia-btn--mint">
              {language === 'vi' ? 'Xem bảng giá gói học' : 'View Pricing Plans'}
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
