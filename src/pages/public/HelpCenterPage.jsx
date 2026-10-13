import { useState } from 'react'
import { Link } from 'react-router-dom'
import './HelpCenterPage.css'

const FAQS = [
  {
    q: 'What level do I need to start learning at Eduvia?',
    a: 'Sociis varius nisl eu ipsum faucibus. Ac semper nisl turpis diam libero id ante nullam. Tellus.',
  },
  {
    q: 'Are the classes self-paced or live?',
    a: 'Sociis varius nisl eu ipsum faucibus. Ac semper nisl turpis diam libero id ante nullam. Tellus.',
  },
  {
    q: 'How long does each course usually take?',
    a: 'Sociis varius nisl eu ipsum faucibus. Ac semper nisl turpis diam libero id ante nullam. Tellus.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Sociis varius nisl eu ipsum faucibus. Ac semper nisl turpis diam libero id ante nullam. Tellus.',
  },
  {
    q: 'Do I get a certificate after finishing a course?',
    a: 'Sociis varius nisl eu ipsum faucibus. Ac semper nisl turpis diam libero id ante nullam. Tellus.',
  },
  {
    q: "What if I'm not confident speaking English yet?",
    a: 'Sociis varius nisl eu ipsum faucibus. Ac semper nisl turpis diam libero id ante nullam. Tellus.',
  },
]

export default function HelpCenterPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="eduvia-page eduvia-help-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">Help Center</h1>
          <p className="eduvia-page-header__desc">
            Cras nisi suspendisse sit semper. Massa erat volutpat volutpat id suspendisse tristique cras a consequat.
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">Home</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>Help Center</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: FAQS (6 ITEMS) ── */}
        <section className="eduvia-faqs-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--green">Faqs</span>
              <h2 className="eduvia-section-title">Answers To Your Common Questions</h2>
            </div>
            <Link to="/contact" className="eduvia-btn eduvia-btn--mint">
              View All FAQs
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

        {/* ── SECTION 2: FIND SUPPORT FOR EVERY NEED (3 CARDS) ── */}
        <section className="eduvia-support-channels">
          <div className="eduvia-section-header eduvia-section-header--center">
            <span className="eduvia-kicker eduvia-kicker--blue">Help Center</span>
            <h2 className="eduvia-section-title">Find Support For Every Need</h2>
            <p className="eduvia-section-header__desc">
              Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
            </p>
          </div>

          <div className="eduvia-channels-grid">
            <div className="eduvia-channel-card">
              <div className="eduvia-channel-card__icon">
                <span className="material-symbols-outlined">chat_bubble</span>
              </div>
              <h3 className="eduvia-channel-card__title">Live Chat</h3>
              <p className="eduvia-channel-card__desc">
                Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.
              </p>
              <Link to="/contact" className="eduvia-btn eduvia-btn--navy">
                Explore Help
              </Link>
            </div>

            <div className="eduvia-channel-card">
              <div className="eduvia-channel-card__icon">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <h3 className="eduvia-channel-card__title">Guide Book</h3>
              <p className="eduvia-channel-card__desc">
                Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.
              </p>
              <Link to="/student/explore" className="eduvia-btn eduvia-btn--navy">
                Read Guides
              </Link>
            </div>

            <div className="eduvia-channel-card">
              <div className="eduvia-channel-card__icon">
                <span className="material-symbols-outlined">headphones</span>
              </div>
              <h3 className="eduvia-channel-card__title">Call Support</h3>
              <p className="eduvia-channel-card__desc">
                Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.
              </p>
              <a href="tel:+1234567890" className="eduvia-btn eduvia-btn--navy">
                Call Now
              </a>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: CONNECT WITH OUR SUPPORT TEAM ── */}
        <section className="eduvia-support-connect">
          <div className="eduvia-support-connect__info">
            <span className="eduvia-kicker eduvia-kicker--green">Contact Us</span>
            <h2 className="eduvia-section-title">Connect With Our Support Team</h2>
            <p className="eduvia-section-desc">
              Pretium lectus mauris commodo viverra orci. Ut dapibus vestibulum mollis neque. Rutrum risus duis vulputate phasellus.
            </p>

            <div className="eduvia-contact-info-list">
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">mail</span></span>
                <div>
                  <span className="eduvia-contact-label">Email Support</span>
                  <strong>support@eduvia.com</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">location_on</span></span>
                <div>
                  <span className="eduvia-contact-label">Office Address</span>
                  <strong>21 Harmony Street, London, UK</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">call</span></span>
                <div>
                  <span className="eduvia-contact-label">Phone Number</span>
                  <strong>+1 234 567 890</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="eduvia-support-connect__form-wrap">
            <form className="eduvia-connect-form" onSubmit={handleSubmit}>
              <div className="eduvia-form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Your full name" required />
              </div>
              <div className="eduvia-form-group">
                <label>Email Address</label>
                <input type="email" placeholder="Your email address" required />
              </div>
              <div className="eduvia-form-group">
                <label>Subject</label>
                <input type="text" placeholder="What is your message about?" required />
              </div>
              <div className="eduvia-form-group">
                <label>Message</label>
                <textarea rows="4" placeholder="Write your message here" required />
              </div>
              <button type="submit" className="eduvia-btn eduvia-btn--lime eduvia-btn--block">
                {sent ? '✓ Message Sent' : 'Send Message'}
              </button>
            </form>
          </div>
        </section>

        {/* ── SECTION 4: PARTNER LOGOS ── */}
        <section className="eduvia-partners-row" aria-label="Accreditations and Partners">
          <img src="/assets/eduvia/Logo-1-1.png" alt="Ultra partner" />
          <img src="/assets/eduvia/Logo-2.png" alt="QC Power XR2" />
          <img src="/assets/eduvia/Logo-3.png" alt="International Standard" />
          <img src="/assets/eduvia/Logo-4.png" alt="Certified Award" />
          <img src="/assets/eduvia/Logo-5.png" alt="Logoipsum" />
        </section>
      </div>
    </div>
  )
}
