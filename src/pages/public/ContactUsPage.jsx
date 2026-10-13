import { useState } from 'react'
import { Link } from 'react-router-dom'
import './ContactUsPage.css'

const FAQS = [
  {
    q: 'What level do I need to start learning at LexiGrow?',
    a: 'Nền tảng hỗ trợ từ trình độ người mới bắt đầu (A1/A2) đến nâng cao (B2/C1). Bạn có thể làm bài kiểm tra đầu vào ngắn để hệ thống tự động gợi ý lộ trình phù hợp.',
  },
  {
    q: 'Are the classes self-paced or live?',
    a: 'LexiGrow hỗ trợ cả hai: các học phần tự học 24/7 với phản hồi tức thì từ AI, đi kèm các buổi hướng dẫn và tương tác cùng giảng viên chuyên môn.',
  },
  {
    q: 'How long does each course usually take?',
    a: 'Mỗi lộ trình được chia thành các bài học vi mô 15-20 phút/ngày, thường kéo dài từ 4 đến 8 tuần tùy thuộc vào mục tiêu và tốc độ học của bạn.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'LexiGrow hỗ trợ thanh toán tự động qua mã VietQR (PayOS) từ tất cả ứng dụng ngân hàng tại Việt Nam, kích hoạt tài khoản ngay sau vài giây.',
  },
  {
    q: 'Do I get a certificate after finishing a course?',
    a: 'Có. Khi hoàn thành toàn bộ bài tập và vượt qua bài kiểm tra cuối khóa, bạn sẽ nhận được chứng nhận điện tử LexiGrow có mã xác thực theo chuẩn CEFR.',
  },
  {
    q: "What if I'm not confident speaking English yet?",
    a: 'Đừng lo lắng! Trợ lý AI nhận diện phát âm và phòng luyện phản xạ tương tác giúp bạn luyện nói trong môi trường an toàn, không phán xét trước khi giao tiếp thực tế.',
  },
]

export default function ContactUsPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="eduvia-page eduvia-contact-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">Contact Us</h1>
          <p className="eduvia-page-header__desc">
            Liên hệ với đội ngũ LexiGrow để nhận tư vấn lộ trình học tập, hỗ trợ kỹ thuật và giải đáp mọi thắc mắc.
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">Home</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>Contact Us</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: CONNECT WITH OUR SUPPORT TEAM ── */}
        <section className="eduvia-support-connect">
          <div className="eduvia-support-connect__info">
            <span className="eduvia-kicker eduvia-kicker--green">Contact Us</span>
            <h2 className="eduvia-section-title">Connect With Our Support Team</h2>
            <p className="eduvia-section-desc">
              Đội ngũ LexiGrow luôn sẵn sàng lắng nghe, tư vấn lộ trình và giải đáp mọi thắc mắc học tập của bạn.
            </p>

            <div className="eduvia-contact-info-list">
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">mail</span></span>
                <div>
                  <span className="eduvia-contact-label">Email Support</span>
                  <strong>support@lexigrow.com</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">location_on</span></span>
                <div>
                  <span className="eduvia-contact-label">Office Address</span>
                  <strong>Hà Nội, Việt Nam</strong>
                </div>
              </div>
              <div className="eduvia-contact-info-item">
                <span className="eduvia-contact-icon"><span className="material-symbols-outlined">call</span></span>
                <div>
                  <span className="eduvia-contact-label">Phone Number</span>
                  <strong>+84 (24) 7300 8888</strong>
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

        {/* ── SECTION 2: PARTNER LOGOS ── */}
        <section className="eduvia-partners-row" aria-label="Accreditations and Partners">
          <img src="/assets/eduvia/Logo-1-1.png" alt="Ultra partner" />
          <img src="/assets/eduvia/Logo-2.png" alt="QC Power XR2" />
          <img src="/assets/eduvia/Logo-3.png" alt="International Standard" />
          <img src="/assets/eduvia/Logo-4.png" alt="Certified Award" />
          <img src="/assets/eduvia/Logo-5.png" alt="Logoipsum" />
        </section>

        {/* ── SECTION 3: MAP VIEW ── */}
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

        {/* ── SECTION 4: FAQS (6 ITEMS) ── */}
        <section className="eduvia-faqs-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--green">Faqs</span>
              <h2 className="eduvia-section-title">Answers To Your Common Questions</h2>
            </div>
            <Link to="/pricing" className="eduvia-btn eduvia-btn--mint">
              View Pricing Plans
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
