import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import paymentService from '../../services/payment.service.js'
import './StudentHome.css'

const POPULAR_COURSES = [
  {
    id: 'speaking-skills',
    tag: 'Speaking',
    tagColor: 'green',
    image: '/assets/eduvia/image-6.jpg',
    rating: 5,
    price: '$49',
    titleVi: 'Nâng cao kỹ năng giao tiếp tiếng Anh tự tin mỗi ngày',
    titleEn: 'Improve Your English Speaking Skills For Confident Daily Communication',
    lessons: '24 Lessons',
    students: '4,800 Students',
    targetUrl: '/student/writing'
  },
  {
    id: 'pronunciation-coach',
    tag: 'Pronunciation',
    tagColor: 'teal',
    image: '/assets/eduvia/image-7.jpg',
    rating: 5,
    price: '$39',
    titleVi: 'Làm chủ phát âm chuẩn quốc tế cùng hướng dẫn chuyên sâu',
    titleEn: 'Master Clear English Pronunciation With Guided Practice And Expert Coaching',
    lessons: '18 Lessons',
    students: '3,200 Students',
    targetUrl: '/student/vocabulary/review'
  },
  {
    id: 'grammar-mastery',
    tag: 'Grammar',
    tagColor: 'green',
    image: '/assets/eduvia/image-8.jpg',
    rating: 5,
    price: '$45',
    titleVi: 'Hệ thống hóa ngữ pháp tiếng Anh thực hành chuẩn xác',
    titleEn: 'Improve Your English Grammar Skills For Confident Daily Communication',
    lessons: '30 Lessons',
    students: '5,600 Students',
    targetUrl: '/student/writing'
  },
  {
    id: 'academic-writing',
    tag: 'Writing',
    tagColor: 'teal',
    image: '/assets/eduvia/image-9.jpg',
    rating: 5,
    price: '$42',
    titleVi: 'Luyện viết luận học thuật chuyên sâu và chấm sửa AI',
    titleEn: 'Build Strong Academic Writing Skills For Essays Reports And Research',
    lessons: '20 Lessons',
    students: '2,750 Students',
    targetUrl: '/student/writing'
  },
  {
    id: 'vocab-builder',
    tag: 'Vocabulary',
    tagColor: 'teal',
    image: '/assets/eduvia/image-10.jpg',
    rating: 5,
    price: '$35',
    titleVi: 'Mở rộng vốn từ vựng phản xạ với phương pháp ghi nhớ SRS',
    titleEn: 'Expand Your English Vocabulary Easily With Effective Daily Learning Methods',
    lessons: '22 Lessons',
    students: '4,100 Students',
    targetUrl: '/student/vocabulary'
  },
  {
    id: 'business-english',
    tag: 'Business English',
    tagColor: 'green',
    image: '/assets/eduvia/image-11.jpg',
    rating: 5,
    price: '$55',
    titleVi: 'Tiếng Anh thương mại cho thuyết trình và đàm phán công việc',
    titleEn: 'Develop Essential Business English Skills For Professional Work And Meetings',
    lessons: '26 Lessons',
    students: '3,980 Students',
    targetUrl: '/student/explore'
  }
]

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quoteVi: 'Nền tảng giúp mình tự tin phản xạ hơn hẳn chỉ sau 3 tuần. Phản hồi AI cực kỳ chi tiết và chỉ ra từng lỗi ngữ cảnh.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Daniel K.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quoteVi: 'Học từ vựng qua flashcard ngắt quãng kết hợp viết luận giúp mình nhớ từ rất lâu mà không bị nhàm chán.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Mia L.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quoteVi: 'Giao diện cực kỳ đẹp mắt, lộ trình từng bước rõ ràng. Các bài tập ngữ pháp và viết luận rất sát đề thi.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Jonathan P.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quoteVi: 'Được theo dõi tiến độ học và điểm tăng trưởng mỗi ngày giúp mình duy trì kỷ luật học tập đều đặn.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Aisha R.',
    course: 'IELTS Prep',
    rating: '4.8/5',
    quoteVi: 'Hệ thống chấm luận 4 tiêu chí chuẩn IELTS giúp mình tăng từ band 6.0 lên 7.5 Writing trong 2 tháng.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Kevin S.',
    course: 'Writing Course',
    rating: '4.8/5',
    quoteVi: 'Cách AI gợi ý cách diễn đạt nâng cao thay thế cho các từ cơ bản rất tự nhiên và học thuật.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Elena T.',
    course: 'Vocabulary Course',
    rating: '4.8/5',
    quoteVi: 'Thử thách giải ô chữ Daily Quest và Vườn tri thức giúp mình không bao giờ quên luyện tập mỗi ngày.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  },
  {
    name: 'Leo D.',
    course: 'TOEFL Prep',
    rating: '4.8/5',
    quoteVi: 'Chương trình học bài bản, giáo viên tận tình và kho bài tập phong phú nhất mình từng trải nghiệm.',
    quoteEn: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.'
  }
]

export default function StudentHome() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [activeAnnouncement, setActiveAnnouncement] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  useEffect(() => {
    let current = true
    if (!user) return undefined
    api.get('/announcements/active')
      .then(({ data }) => {
        if (current) {
          setAnnouncements(Array.isArray(data?.data) ? data.data : [])
          setActiveAnnouncement(0)
        }
      })
      .catch(() => {
        if (current) setAnnouncements([])
      })
    return () => { current = false }
  }, [user])

  const visibleAnnouncements = user ? announcements : []
  const currentAnnouncementIndex = Math.min(activeAnnouncement, Math.max(visibleAnnouncements.length - 1, 0))
  const announcement = visibleAnnouncements[currentAnnouncementIndex]
  const announcementTitle = language === 'vi' ? announcement?.titleVi : announcement?.titleEn
  const announcementBody = language === 'vi' ? announcement?.bodyVi : announcement?.bodyEn
  const actionLabel = language === 'vi' ? announcement?.actionLabelVi : announcement?.actionLabelEn

  return (
    <div className="eduvia-home">
      {/* ── Active Announcement Bar (if present) ── */}
      {announcement && (
        <section className="eduvia-announcement" aria-labelledby="eduvia-announcement-title">
          <div className="eduvia-announcement__copy">
            <span className="eduvia-announcement__tag">
              <span className="eduvia-announcement__dot" />
              {t('homePage.eventLabel', 'Thông báo đặc biệt')}
            </span>
            <h2 id="eduvia-announcement-title">{announcementTitle}</h2>
            <p>{announcementBody}</p>
            {announcement.actionUrl && actionLabel && (
              /^https?:\/\//i.test(announcement.actionUrl)
                ? <a className="eduvia-btn eduvia-btn--lime" href={announcement.actionUrl} target="_blank" rel="noopener noreferrer">{actionLabel} <span className="material-symbols-outlined">arrow_outward</span></a>
                : <Link className="eduvia-btn eduvia-btn--lime" to={announcement.actionUrl}>{actionLabel} <span className="material-symbols-outlined">arrow_forward</span></Link>
            )}
          </div>
          {(announcement.bannerUrl || announcement.imageUrl) && (
            <img className="eduvia-announcement__img" src={announcement.bannerUrl || announcement.imageUrl} alt="" loading="lazy" />
          )}
        </section>
      )}

      {/* ── SECTION 1: HERO (Sky pastel background + Cutout student + Floating cards) ── */}
      <section className="eduvia-hero" aria-labelledby="eduvia-hero-title">
        <div className="eduvia-hero__container">
          <div className="eduvia-hero__copy">
            <div className="eduvia-hero__badge">
              <span className="eduvia-hero__badge-icon">
                <span className="material-symbols-outlined">menu_book</span>
              </span>
              <span>Eduvia - English Online Course</span>
            </div>

            <h1 id="eduvia-hero-title" className="eduvia-hero__title">
              Upgrade English For Real Success
            </h1>

            <p className="eduvia-hero__subtitle">
              {language === 'vi'
                ? 'Trải nghiệm nền tảng học tiếng Anh trực tuyến hiện đại giúp bạn tự tin viết luận, giao tiếp lưu loát và nâng tầm điểm số.'
                : 'Experience a modern learning platform that helps you speak, write, and understand English with clarity and confidence.'}
            </p>

            <div className="eduvia-hero__cta-group">
              <Link to="/student/explore" className="eduvia-btn eduvia-btn--lime">
                {language === 'vi' ? 'Khám phá khóa học' : 'Explore Courses'}
              </Link>
              <Link to={user ? '/student/dashboard' : '/login'} className="eduvia-btn eduvia-btn--ghost">
                {user ? (language === 'vi' ? 'Vào bàn học' : 'Go to Dashboard') : (language === 'vi' ? 'Đăng nhập' : 'Sign In')}
              </Link>
            </div>

            {/* Social Proof Stack */}
            <div className="eduvia-hero__proof">
              <div className="eduvia-hero__avatars">
                <img src="/assets/eduvia/image-19-300x296.jpg" alt="Student 1" className="eduvia-avatar" />
                <img src="/assets/eduvia/image-20-300x296.jpg" alt="Student 2" className="eduvia-avatar" />
                <img src="/assets/eduvia/image-21-300x296.jpg" alt="Student 3" className="eduvia-avatar" />
              </div>
              <div className="eduvia-hero__proof-text">
                <strong>12,000+</strong>
                <span>{language === 'vi' ? 'Học viên toàn cầu' : 'Active Global Students'}</span>
              </div>
            </div>
          </div>

          <div className="eduvia-hero__visual">
            <div className="eduvia-hero__visual-inner">
              <img
                src="/assets/eduvia/Image.png"
                alt="Student smiling with laptop"
                className="eduvia-hero__student"
                fetchPriority="high"
              />

              {/* Floating Badge 1 (Top-Right) */}
              <div className="eduvia-float-card eduvia-float-card--top">
                <div className="eduvia-float-card__icon eduvia-float-card__icon--green">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div className="eduvia-float-card__text">
                  <h4>Certified English Program</h4>
                  <p>Globally Recognized</p>
                </div>
              </div>

              {/* Floating Badge 2 (Bottom-Left) */}
              <div className="eduvia-float-card eduvia-float-card--bottom">
                <div className="eduvia-float-card__icon eduvia-float-card__icon--purple">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div className="eduvia-float-card__text">
                  <h4>Interactive Live Sessions</h4>
                  <p>Real Practice & AI Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: 4 FEATURES BAR (Quick Progress, Peer Learning, Instant Correction, Guided Routine) ── */}
      <section className="eduvia-features-bar" aria-label="Core Benefits">
        <div className="eduvia-features-bar__item">
          <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">menu_book</span></span>
          <div className="eduvia-features-bar__text">
            <h3>Quick Progress</h3>
            <p>Fast Learning Method</p>
          </div>
        </div>

        <div className="eduvia-features-bar__item">
          <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">menu_book</span></span>
          <div className="eduvia-features-bar__text">
            <h3>Peer Learning</h3>
            <p>Supportive Study Community</p>
          </div>
        </div>

        <div className="eduvia-features-bar__item">
          <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">menu_book</span></span>
          <div className="eduvia-features-bar__text">
            <h3>Instant Correction</h3>
            <p>Smart Feedback System</p>
          </div>
        </div>

        <div className="eduvia-features-bar__item">
          <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">menu_book</span></span>
          <div className="eduvia-features-bar__text">
            <h3>Guided Routine</h3>
            <p>Consistent Weekly Plan</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: DUAL PROMO SPLIT (Student Collab Photo + Navy Discount Banner) ── */}
      <section className="eduvia-promo-split" aria-label="Special Offers">
        {/* Left Promo Card */}
        <div className="eduvia-promo-card eduvia-promo-card--photo">
          <img src="/assets/eduvia/image-14.jpg" alt="Students studying together" className="eduvia-promo-card__bg-img" />
          <div className="eduvia-promo-badge-rating">
            <div className="eduvia-promo-badge-rating__score">4.9/5 ★</div>
            <div className="eduvia-promo-badge-rating__label">Average Student Rating</div>
          </div>
        </div>

        {/* Right Promo Card */}
        <div className="eduvia-promo-card eduvia-promo-card--navy">
          <div className="eduvia-promo-card__content">
            <span className="eduvia-pill-badge eduvia-pill-badge--green">Save Big</span>
            <h2>Learn English With Special Offer</h2>
            <p>
              Get exclusive discounts on selected English courses this month. Upgrade your skills at a lower price.
            </p>
            <Link to="/pricing" className="eduvia-btn eduvia-btn--lime">
              Claim Discount
            </Link>
          </div>
          <div className="eduvia-promo-card__cutout">
            <img src="/assets/eduvia/image-23.png" alt="Happy student with laptop" />
          </div>
        </div>
      </section>

      {/* ── SECTION 4: POPULAR COURSES GRID (6 Course Cards with Stars & Enroll Now) ── */}
      <section className="eduvia-courses-section" aria-labelledby="eduvia-courses-title">
        <div className="eduvia-section-header">
          <div>
            <span className="eduvia-kicker eduvia-kicker--green">Popular Courses</span>
            <h2 id="eduvia-courses-title" className="eduvia-section-title">
              Build English Skills With Expert Lessons
            </h2>
          </div>
          <Link to="/student/explore" className="eduvia-btn eduvia-btn--mint">
            View All Courses
          </Link>
        </div>

        <div className="eduvia-courses-grid">
          {POPULAR_COURSES.map(course => (
            <article className="eduvia-course-card" key={course.id}>
              <div className="eduvia-course-card__image-wrap">
                <img src={course.image} alt="" className="eduvia-course-card__img" loading="lazy" />
                <span className={`eduvia-course-card__tag eduvia-course-card__tag--${course.tagColor}`}>
                  {course.tag}
                </span>
              </div>

              <div className="eduvia-course-card__body">
                <div className="eduvia-course-card__meta-top">
                  <div className="eduvia-course-card__stars">
                    {'★★★★★'}
                  </div>
                  <div className="eduvia-course-card__price">
                    {course.price}
                  </div>
                </div>

                <h3 className="eduvia-course-card__title">
                  <Link to={course.targetUrl}>
                    {language === 'vi' ? course.titleVi : course.titleEn}
                  </Link>
                </h3>

                <div className="eduvia-course-card__details">
                  <span className="eduvia-course-card__detail-item">
                    <span className="material-symbols-outlined eduvia-icon-purple">menu_book</span>
                    <span>{course.lessons}</span>
                  </span>
                  <span className="eduvia-course-card__detail-item">
                    <span className="material-symbols-outlined eduvia-icon-teal">person</span>
                    <span>{course.students}</span>
                  </span>
                </div>

                <Link to={course.targetUrl} className="eduvia-btn eduvia-btn--navy eduvia-btn--full">
                  Enroll Now
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: EMPOWERING STUDENTS / STATS SECTION ── */}
      <section className="eduvia-empower-section" aria-label="Empowerment and Statistics">
        <div className="eduvia-empower__grid">
          <div className="eduvia-empower__visual">
            <img src="/assets/eduvia/image-4.jpg" alt="Students in modern library" className="eduvia-empower__img" loading="lazy" />
          </div>

          <div className="eduvia-empower__copy">
            <h2>Empowering Students With Better English Skills</h2>
            <p>
              LexiGrow brings you the perfect blend of natural immersion, active vocabulary flashcards, and instant AI writing corrections to help you unlock academic and professional confidence.
            </p>
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--lime">
              Read Our Story
            </Link>

            <div className="eduvia-empower__stats-row">
              <div className="eduvia-stat-box">
                <span className="eduvia-stat-box__number">450+</span>
                <span className="eduvia-stat-box__label">Completed Course Modules</span>
              </div>
              <div className="eduvia-stat-box">
                <span className="eduvia-stat-box__number">155+</span>
                <span className="eduvia-stat-box__label">Professional English Tutors</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: WHY CHOOSE LEXIGROW / VIDEO PLAYER ── */}
      <section className="eduvia-why-section" aria-labelledby="eduvia-why-title">
        <div className="eduvia-center-header">
          <span className="eduvia-kicker eduvia-kicker--purple">Why Choose Eduvia</span>
          <h2 id="eduvia-why-title" className="eduvia-section-title">
            Learn English Faster With Better Guidance
          </h2>
        </div>

        <div className="eduvia-why-cards">
          <div className="eduvia-why-card">
            <span className="eduvia-why-card__icon"><span className="material-symbols-outlined">menu_book</span></span>
            <h3>High Quality English Learning System</h3>
            <p>Structured curriculum designed by international ESL educators and linguistic experts.</p>
          </div>

          <div className="eduvia-why-card">
            <span className="eduvia-why-card__icon"><span className="material-symbols-outlined">menu_book</span></span>
            <h3>High Quality English Learning System</h3>
            <p>Smart Spaced Repetition algorithms that track memory decay and prompt optimal reviews.</p>
          </div>

          <div className="eduvia-why-card">
            <span className="eduvia-why-card__icon"><span className="material-symbols-outlined">menu_book</span></span>
            <h3>High Quality English Learning System</h3>
            <p>Cutting-edge AI essay evaluations with comprehensive grammatical and lexical suggestions.</p>
          </div>
        </div>

        {/* Video Mockup */}
        <div className="eduvia-video-container">
          <img src="/assets/eduvia/image-13.jpg" alt="Student listening with headphones" className="eduvia-video-container__poster" />
          <button
            type="button"
            className="eduvia-video-container__play-btn"
            aria-label="Play introduction video"
            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
          >
            <span className="material-symbols-outlined">play_arrow</span>
          </button>
        </div>
      </section>

      {/* ── SECTION 7: CHOOSE PLANS THAT FIT YOUR LEARNING ── */}
      <section className="eduvia-pricing-section" aria-labelledby="eduvia-home-pricing-title">
        <div className="eduvia-section-header">
          <div>
            <span className="eduvia-kicker eduvia-kicker--green">Course Pricing</span>
            <h2 id="eduvia-home-pricing-title" className="eduvia-section-title">
              Choose Plans That Fit Your Learning
            </h2>
          </div>
          <p className="eduvia-section-desc">
            Affordable learning packages designed for every ambition, from self-study learners to academic IELTS candidates.
          </p>
        </div>

        <div className="eduvia-pricing-cards">
          {/* Card 1: Basic */}
          <div className="eduvia-price-card">
            <div className="eduvia-price-card__header eduvia-price-card__header--purple">
              <span className="eduvia-price-card__plan-name">BASIC PLAN</span>
              <div className="eduvia-price-card__amount">
                <strong>$19</strong><span>/month</span>
              </div>
              <p>Pharetra auctor fusce dui id lectus nibh id non vestibulum. Aliquet a ipsum semper et lectus egestas vitae laoreet.</p>
              <Link to="/pricing" className="eduvia-btn eduvia-btn--lime eduvia-btn--full">
                Get Basic Plan
              </Link>
            </div>
            <div className="eduvia-price-card__body">
              <h4>Included:</h4>
              <ul className="eduvia-price-card__checklist">
                <li><span className="material-symbols-outlined">check</span> Beginner to Intermediate module</li>
                <li><span className="material-symbols-outlined">check</span> Guided video lessons</li>
                <li><span className="material-symbols-outlined">check</span> Practice worksheets</li>
                <li><span className="material-symbols-outlined">check</span> Mobile app access</li>
                <li><span className="material-symbols-outlined">check</span> Basic progress tracking</li>
              </ul>
              <div className="eduvia-price-card__footer-note">
                <strong>Best for starters</strong>
                <p>Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Standard (Highlighted) */}
          <div className="eduvia-price-card eduvia-price-card--featured">
            <div className="eduvia-price-card__header eduvia-price-card__header--green">
              <span className="eduvia-price-card__plan-name">STANDARD PLAN</span>
              <div className="eduvia-price-card__amount">
                <strong>$39</strong><span>/month</span>
              </div>
              <p>Pharetra auctor fusce dui id lectus nibh id non vestibulum. Aliquet a ipsum semper et lectus egestas vitae laoreet.</p>
              <Link to="/pricing" className="eduvia-btn eduvia-btn--lime eduvia-btn--full">
                Choose Standard
              </Link>
            </div>
            <div className="eduvia-price-card__body">
              <h4>Included:</h4>
              <ul className="eduvia-price-card__checklist">
                <li><span className="material-symbols-outlined">check</span> All Basic features</li>
                <li><span className="material-symbols-outlined">check</span> Speaking practice sessions</li>
                <li><span className="material-symbols-outlined">check</span> Pronunciation improvement tools</li>
                <li><span className="material-symbols-outlined">check</span> Interactive quizzes</li>
                <li><span className="material-symbols-outlined">check</span> Certificate of completion</li>
              </ul>
              <div className="eduvia-price-card__footer-note">
                <strong>Most popular plan</strong>
                <p>Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus.</p>
              </div>
            </div>
          </div>

          {/* Card 3: Premium */}
          <div className="eduvia-price-card">
            <div className="eduvia-price-card__header eduvia-price-card__header--purple">
              <span className="eduvia-price-card__plan-name">PREMIUM PLAN</span>
              <div className="eduvia-price-card__amount">
                <strong>$69</strong><span>/month</span>
              </div>
              <p>Pharetra auctor fusce dui id lectus nibh id non vestibulum. Aliquet a ipsum semper et lectus egestas vitae laoreet.</p>
              <Link to="/pricing" className="eduvia-btn eduvia-btn--lime eduvia-btn--full">
                Get Premium
              </Link>
            </div>
            <div className="eduvia-price-card__body">
              <h4>Included:</h4>
              <ul className="eduvia-price-card__checklist">
                <li><span className="material-symbols-outlined">check</span> All Standard features</li>
                <li><span className="material-symbols-outlined">check</span> 1-on-1 tutor sessions</li>
                <li><span className="material-symbols-outlined">check</span> Custom study roadmap</li>
                <li><span className="material-symbols-outlined">check</span> Advanced exam preparation</li>
                <li><span className="material-symbols-outlined">check</span> Priority student support</li>
              </ul>
              <div className="eduvia-price-card__footer-note">
                <strong>Full learning access</strong>
                <p>Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: MIDNIGHT NAVY CTA BANNER ── */}
      <section className="eduvia-dark-cta" aria-label="Call to action">
        <div className="eduvia-dark-cta__inner">
          <span className="eduvia-dark-cta__kicker">Why Choose Eduvia</span>
          <h2>Begin Your English Journey With Confidence</h2>
          <p>
            Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
          </p>
          <div className="eduvia-dark-cta__actions">
            <Link to={user ? '/student/dashboard' : '/register'} className="eduvia-btn eduvia-btn--lime">
              Get Started
            </Link>
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--mint">
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: TESTIMONIALS GRID (8 Student Review Cards) ── */}
      <section className="eduvia-testimonials-section" aria-labelledby="eduvia-testi-title">
        <div className="eduvia-section-header">
          <div>
            <span className="eduvia-kicker eduvia-kicker--green">Student Voices</span>
            <h2 id="eduvia-testi-title" className="eduvia-section-title">
              Real Stories From Our English Learners
            </h2>
          </div>
          <p className="eduvia-section-desc">
            Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
          </p>
        </div>

        <div className="eduvia-testimonials-grid">
          {TESTIMONIALS.map((t, idx) => (
            <article className="eduvia-testi-card" key={idx}>
              <div className="eduvia-testi-card__stars">
                <span className="eduvia-testi-stars">★★★★★</span>
                <span className="eduvia-testi-rating">{t.rating}</span>
              </div>
              <p className="eduvia-testi-card__quote">
                {language === 'vi' ? t.quoteVi : t.quoteEn}
              </p>
              <div className="eduvia-testi-card__footer">
                <strong className="eduvia-testi-card__author">{t.name}</strong>
                <span className="eduvia-testi-card__badge">{t.course}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
