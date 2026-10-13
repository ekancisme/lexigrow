import { useState } from 'react'
import { Link } from 'react-router-dom'
import './HelpCenterPage.css'

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
            Tìm kiếm câu trả lời nhanh chóng cho các thắc mắc thường gặp và nhận sự hỗ trợ kịp thời từ đội ngũ LexiGrow.
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
              Chúng tôi cung cấp nhiều kênh hỗ trợ linh hoạt để đảm bảo trải nghiệm học tập của bạn luôn liền mạch và hiệu quả.
            </p>
          </div>

          <div className="eduvia-channels-grid">
            <div className="eduvia-channel-card">
              <div className="eduvia-channel-card__icon">
                <span className="material-symbols-outlined">chat_bubble</span>
              </div>
              <h3 className="eduvia-channel-card__title">Live Chat</h3>
              <p className="eduvia-channel-card__desc">
                Nhắn tin trực tiếp với chuyên viên tư vấn để được giải đáp thắc mắc về khóa học và lộ trình trong giờ làm việc.
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
                Tài liệu hướng dẫn sử dụng tính năng ôn từ vựng SRS, nộp bài viết luận và theo dõi biểu đồ tiến bộ chi tiết.
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
                Đường dây nóng hỗ trợ kỹ thuật và giải quyết các vấn đề liên quan đến tài khoản hoặc thanh toán học phí.
              </p>
              <a href="tel:+842473008888" className="eduvia-btn eduvia-btn--navy">
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
