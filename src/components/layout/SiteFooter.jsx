import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './SiteFooter.css'

export default function SiteFooter() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const homePath = !user || user.role === 'student' ? '/student/home' : `/${user.role}/dashboard`

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer className="eduvia-footer" aria-label="LexiGrow Site Footer">
      <div className="eduvia-footer__inner">
        {/* Column 1: Brand & Contact Info */}
        <div className="eduvia-footer__col eduvia-footer__col--brand">
          <Link to={homePath} className="eduvia-footer__logo" aria-label="LexiGrow">
            <span className="eduvia-footer__logo-mark">
              <img src="/assets/brand/lexigrow-emblem.png" alt="" width="34" height="34" className="eduvia-footer__brand-img" />
            </span>
            <span className="eduvia-footer__logo-text">LexiGrow</span>
          </Link>

          <p className="eduvia-footer__text">
            {language === 'vi'
              ? 'Liên hệ chúng tôi trong giờ làm việc Thứ 2 - Thứ 6 (8:00 - 18:00). Đội ngũ LexiGrow luôn sẵn sàng đồng hành cùng bạn.'
              : 'Feel free to contact us in working hours Mon - Fri (8:00 - 18:00). The LexiGrow team is always happy to support your queries.'}
          </p>

          <a href="tel:+842473008888" className="eduvia-footer__phone">
            <span className="material-symbols-outlined">call</span>
            <span>+84 (24) 7300 8888</span>
          </a>

          <div className="eduvia-footer__socials" aria-label="Social media">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="eduvia-footer__social-btn">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="eduvia-footer__social-btn">
              <span className="material-symbols-outlined">alternate_email</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="eduvia-footer__social-btn">
              <span className="material-symbols-outlined">work</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="eduvia-footer__social-btn">
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
          </div>
        </div>

        {/* Column 2: Company */}
        <div className="eduvia-footer__col">
          <h3 className="eduvia-footer__heading">{language === 'vi' ? 'Về chúng tôi' : 'Company'}</h3>
          <ul className="eduvia-footer__links">
            <li><Link to="/about">{language === 'vi' ? 'Giới thiệu' : 'About Us'}</Link></li>
            <li><Link to="/about">{language === 'vi' ? 'Sứ mệnh & Giá trị' : 'Our Mission'}</Link></li>
            <li><Link to="/pricing">{language === 'vi' ? 'Bảng giá & Gói học' : 'Pricing Plans'}</Link></li>
            <li><Link to="/contact">{language === 'vi' ? 'Liên hệ' : 'Contact Us'}</Link></li>
          </ul>
        </div>

        {/* Column 3: Courses */}
        <div className="eduvia-footer__col">
          <h3 className="eduvia-footer__heading">{language === 'vi' ? 'Khóa học & Chủ đề' : 'Courses & Topics'}</h3>
          <ul className="eduvia-footer__links">
            <li><Link to="/student/explore">{language === 'vi' ? 'Tiếng Anh nền tảng' : 'Beginner English'}</Link></li>
            <li><Link to="/student/explore">{language === 'vi' ? 'Tiếng Anh trung cấp' : 'Intermediate English'}</Link></li>
            <li><Link to="/student/explore">{language === 'vi' ? 'Tiếng Anh nâng cao' : 'Advanced English'}</Link></li>
            <li><Link to="/student/explore">{language === 'vi' ? 'Tiếng Anh thương mại' : 'Business English'}</Link></li>
            <li><Link to="/student/explore">{language === 'vi' ? 'Luyện viết luận AI' : 'AI Essay Writing'}</Link></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="eduvia-footer__col">
          <h3 className="eduvia-footer__heading">{language === 'vi' ? 'Hỗ trợ' : 'Support'}</h3>
          <ul className="eduvia-footer__links">
            <li><Link to="/contact">{language === 'vi' ? 'Trung tâm hỗ trợ' : 'Help & Support'}</Link></li>
            <li><Link to="/contact">{language === 'vi' ? 'Câu hỏi thường gặp' : 'FAQs'}</Link></li>
            <li><Link to="/about">{language === 'vi' ? 'Phương pháp học tập' : 'Learning Methodology'}</Link></li>
            <li><Link to="/pricing">{language === 'vi' ? 'Chính sách hoàn tiền' : 'Refund Policy'}</Link></li>
            <li><Link to="/contact">{language === 'vi' ? 'Gửi yêu cầu trợ giúp' : 'Submit Ticket'}</Link></li>
          </ul>
        </div>

        {/* Column 5: Newsletter */}
        <div className="eduvia-footer__col eduvia-footer__col--newsletter">
          <h3 className="eduvia-footer__heading">{language === 'vi' ? 'Đăng ký nhận tin' : 'Subscribe To Newsletter'}</h3>
          <form className="eduvia-footer__form" onSubmit={handleSubscribe}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'vi' ? 'Nhập email của bạn...' : 'Enter your email...'}
              required
              className="eduvia-footer__input"
            />
            <button type="submit" className="eduvia-btn eduvia-btn--lime eduvia-footer__submit">
              {subscribed ? (language === 'vi' ? '✓ Đã đăng ký' : '✓ Subscribed') : (language === 'vi' ? 'Đăng ký' : 'Subscribe')}
            </button>
          </form>
          {subscribed && (
            <p className="eduvia-footer__subscribed-msg">
              {language === 'vi' ? 'Cảm ơn bạn đã đăng ký nhận bản tin!' : 'Thank you for subscribing!'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Copyright & Legal Links */}
      <div className="eduvia-footer__bottom">
        <div className="eduvia-footer__bottom-inner">
          <p className="eduvia-footer__copy-text">
            {language === 'vi'
              ? `Bản quyền © ${new Date().getFullYear()} LexiGrow. Bảo lưu mọi quyền.`
              : `Copyright © ${new Date().getFullYear()} LexiGrow. All rights reserved.`}
          </p>
          <div className="eduvia-footer__legal-links">
            <Link to="/pricing">{language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Use'}</Link>
            <span>·</span>
            <Link to="/pricing">{language === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy'}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
