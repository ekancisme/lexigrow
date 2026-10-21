import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import './StudentHome.css'

const CATEGORY_PILLS = [
  { id: 'all', labelVi: 'All Recommendation', labelEn: 'All Recommendation' },
  { id: 'illustrator', labelVi: 'Adobe Illustrator', labelEn: 'Adobe Illustrator' },
  { id: 'photoshop', labelVi: 'Adobe Photoshop', labelEn: 'Adobe Photoshop' },
  { id: 'design', labelVi: 'UI Design', labelEn: 'UI Design' },
  { id: 'web', labelVi: 'Web Programming', labelEn: 'Web Programming' },
  { id: 'mobile', labelVi: 'Mobile Programming', labelEn: 'Mobile Programming' },
  { id: 'backend', labelVi: 'Backend Development', labelEn: 'Backend Development' },
  { id: 'vue', labelVi: 'Vue JS', labelEn: 'Vue JS' },
]

const STUDIO_COURSES = [
  {
    id: 'course-1',
    image: '/assets/editorial/courses/vue-course.png',
    title: 'VUE JS SCRATCH COURSE',
    category: 'web',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/writing',
  },
  {
    id: 'course-2',
    image: '/assets/editorial/courses/ui-design.png',
    title: 'UI DESIGN FOR BEGINNERS',
    category: 'design',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'course-3',
    image: '/assets/editorial/courses/mobile-dev.png',
    title: 'MOBILE DEV REACT NATIVE',
    category: 'mobile',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'course-4',
    image: '/assets/editorial/courses/website-zero.png',
    title: 'WEBSITE DEV ZERO TO HERO',
    category: 'web',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
]

const TRENDING_COURSES = [
  {
    id: 'trend-1',
    image: '/assets/editorial/courses/mobile-dev.png',
    title: 'Adobe Illustrator Scretch Course',
    category: 'design',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-2',
    image: '/assets/editorial/courses/swift-dev.png',
    title: 'Bootcamp Vue.js Web Framework',
    category: 'web',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-3',
    image: '/assets/editorial/courses/website-zero.png',
    title: 'Design Fundamentals',
    category: 'design',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-4',
    image: '/assets/editorial/courses/uber-clone.png',
    title: 'Ionic - Build iOS, Android & Web...',
    category: 'mobile',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-5',
    image: '/assets/editorial/courses/modern-art.png',
    title: 'Adobe Illustrator Scretch Course',
    category: 'design',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-6',
    image: '/assets/editorial/courses/desk-notes.png',
    title: 'Bootcamp Vue.js Web Framework',
    category: 'web',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-7',
    image: '/assets/editorial/courses/vue-course.png',
    title: 'Design Fundamentals',
    category: 'design',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
  {
    id: 'trend-8',
    image: '/assets/editorial/courses/ui-design.png',
    title: 'Ionic - Build iOS, Android & Web...',
    category: 'mobile',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    bestSeller: true,
    discount: '20% OFF',
    href: '/student/explore',
  },
]

const POPULAR_MENTORS = [
  {
    name: 'Alexander Bastian',
    role: 'Expert Mobile Engineer',
    image: '/assets/editorial/instructors/alexander.png',
  },
  {
    name: 'Labie Carthaline',
    role: 'Marketing Specialist',
    image: '/assets/editorial/instructors/labie.png',
  },
  {
    name: 'Jonathan Doe',
    role: 'Financial Strategiest',
    image: '/assets/editorial/instructors/jonathan.png',
  },
  {
    name: 'Sarasvati',
    role: 'Film & Video Director',
    image: '/assets/editorial/instructors/sarasvati.png',
  },
]

export default function StudentHome() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [announcements, setAnnouncements] = useState([])
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState('')

  useEffect(() => {
    let current = true
    if (!user) return undefined
    api.get('/announcements/active')
      .then(({ data }) => {
        if (current) setAnnouncements(Array.isArray(data?.data) ? data.data : [])
      })
      .catch(() => {
        if (current) setAnnouncements([])
      })
    return () => { current = false }
  }, [user])

  const filteredStudio = selectedCategory === 'all'
    ? STUDIO_COURSES
    : STUDIO_COURSES.filter(c => c.category === selectedCategory)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!subscribeEmail) return
    setSubscribeStatus(language === 'vi' ? 'Đã đăng ký thành công! Cảm ơn bạn.' : 'Successfully subscribed! Thank you.')
    setSubscribeEmail('')
  }

  return (
    <div className="student-home-figma">
      {/* ── Optional Announcement Banner ── */}
      {announcements.length > 0 && announcements[0] && (
        <div className="figma-announcement-bar">
          <span className="material-symbols-outlined">campaign</span>
          <span>{language === 'vi' ? announcements[0].titleVi : announcements[0].titleEn}</span>
          {announcements[0].actionUrl && (
            <Link to={announcements[0].actionUrl} className="figma-announcement-link">
              {language === 'vi' ? 'Xem ngay' : 'View now'} →
            </Link>
          )}
        </div>
      )}

      {/* ── 1. Hero Spotlight Carousel (Figma Design) ── */}
      <section className="figma-hero" aria-label="Hero Spotlight">
        <div className="figma-hero__slider">
          {activeSlide === 0 ? (
            <div className="figma-hero__slide figma-hero__slide--teal">
              <div className="figma-hero__content">
                <h1 className="figma-hero__title">
                  {language === 'vi' ? 'Học điều mới mỗi ngày cùng LexiGrow.' : 'Learn something new everyday.'}
                </h1>
                <p className="figma-hero__subtitle">
                  {language === 'vi'
                    ? 'Nâng cao năng lực tiếng Anh học thuật và sẵn sàng hội nhập toàn cầu.'
                    : 'Become professionals and ready to join the world.'
                  }
                </p>
                <Link to="/student/explore" className="figma-hero__cta">
                  <span>{language === 'vi' ? 'Khám phá khóa học' : 'Explore Courses'}</span>
                </Link>
              </div>

              <div className="figma-hero__media">
                <img
                  src="/assets/editorial/home/figma-hero-banner.png"
                  alt="Spotlight Showcase"
                  className="figma-hero__banner-img"
                />
              </div>
            </div>
          ) : (
            <div className="figma-hero__slide figma-hero__slide--yellow">
              <div className="figma-hero__content">
                <h1 className="figma-hero__title">
                  {language === 'vi' ? 'Chinh phục từ vựng và bài luận xuất sắc.' : 'Master vocabulary and writing excellence.'}
                </h1>
                <p className="figma-hero__subtitle">
                  {language === 'vi'
                    ? 'Phương pháp học tập cá nhân hóa được hỗ trợ bởi công nghệ AI thông minh.'
                    : 'Personalized practice powered by our advanced linguistic engine.'
                  }
                </p>
                <Link to="/student/writing" className="figma-hero__cta">
                  <span>{language === 'vi' ? 'Bắt đầu luyện viết' : 'Start Writing Practice'}</span>
                </Link>
              </div>

              <div className="figma-hero__media">
                <img
                  src="/assets/editorial/home/figma-hero-banner-2.png"
                  alt="Spotlight Showcase 2"
                  className="figma-hero__banner-img"
                />
              </div>
            </div>
          )}

          {/* Slider Controls */}
          <button
            type="button"
            className="figma-hero__arrow figma-hero__arrow--prev"
            onClick={() => setActiveSlide(prev => (prev === 0 ? 1 : 0))}
            aria-label="Previous Slide"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            className="figma-hero__arrow figma-hero__arrow--next"
            onClick={() => setActiveSlide(prev => (prev === 0 ? 1 : 0))}
            aria-label="Next Slide"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="figma-hero__dots">
          <button
            type="button"
            className={`figma-hero__dot ${activeSlide === 0 ? 'is-active' : ''}`}
            onClick={() => setActiveSlide(0)}
            aria-label="Slide 1"
          />
          <button
            type="button"
            className={`figma-hero__dot ${activeSlide === 1 ? 'is-active' : ''}`}
            onClick={() => setActiveSlide(1)}
            aria-label="Slide 2"
          />
        </div>
      </section>

      {/* ── 2. Category Filter Pills (Figma Design) ── */}
      <section className="figma-category-bar" aria-label="Course Categories">
        <div className="figma-category-list">
          {CATEGORY_PILLS.map((pill) => {
            const label = language === 'vi' ? pill.labelVi : pill.labelEn
            const isActive = selectedCategory === pill.id
            return (
              <button
                key={pill.id}
                type="button"
                className={`figma-pill ${isActive ? 'figma-pill--active' : ''}`}
                onClick={() => setSelectedCategory(pill.id)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. More from MyCourse Studio (Figma Design) ── */}
      <section className="figma-section" aria-labelledby="heading-studio">
        <div className="figma-section__header">
          <div>
            <h2 id="heading-studio" className="figma-section__title">
              More from MyCourse Studio
            </h2>
            <p className="figma-section__subtitle">
              We know the best things for You. Top picks for You.
            </p>
          </div>
          <Link to="/student/explore" className="figma-section__more-link">
            <span>{language === 'vi' ? 'Xem tất cả' : 'View all'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        <div className="figma-card-grid">
          {filteredStudio.map((course) => (
            <div
              key={course.id}
              className="figma-course-card"
              onClick={() => navigate(course.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(course.href) }}
            >
              <div className="figma-course-card__thumb-wrap">
                <img src={course.image} alt={course.title} className="figma-course-card__thumb" />
                <div className="figma-course-card__badges">
                  {course.bestSeller && (
                    <span className="figma-badge figma-badge--bestseller">Best Seller</span>
                  )}
                  {course.discount && (
                    <span className="figma-badge figma-badge--discount">{course.discount}</span>
                  )}
                </div>
              </div>

              <div className="figma-course-card__body">
                <h3 className="figma-course-card__title">{course.title}</h3>
                <div className="figma-course-card__instructor">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                  <span>{course.instructor}</span>
                </div>
                <p className="figma-course-card__desc">{course.desc}</p>
                <div className="figma-course-card__rating">
                  <div className="figma-stars" aria-label={`Rating ${course.rating}`}>
                    {'★'.repeat(5)}
                  </div>
                  <span className="figma-reviews">({course.reviews})</span>
                </div>
                <div className="figma-course-card__price-row">
                  <span className="figma-price-current">{course.price}</span>
                  <span className="figma-price-original">{course.originalPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Trending Course (Figma Design) ── */}
      <section className="figma-section" aria-labelledby="heading-trending">
        <div className="figma-section__header">
          <div>
            <h2 id="heading-trending" className="figma-section__title">
              Trending Course
            </h2>
            <p className="figma-section__subtitle">
              We know the best things for You. Top picks for You.
            </p>
          </div>
          <Link to="/student/explore" className="figma-section__more-link">
            <span>{language === 'vi' ? 'Xem tất cả' : 'View all'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        <div className="figma-card-grid">
          {TRENDING_COURSES.map((course) => (
            <div
              key={course.id}
              className="figma-course-card"
              onClick={() => navigate(course.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(course.href) }}
            >
              <div className="figma-course-card__thumb-wrap">
                <img src={course.image} alt={course.title} className="figma-course-card__thumb" />
                <div className="figma-course-card__badges">
                  {course.bestSeller && (
                    <span className="figma-badge figma-badge--bestseller">Best Seller</span>
                  )}
                  {course.discount && (
                    <span className="figma-badge figma-badge--discount">{course.discount}</span>
                  )}
                </div>
              </div>

              <div className="figma-course-card__body">
                <h3 className="figma-course-card__title">{course.title}</h3>
                <div className="figma-course-card__instructor">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                  <span>{course.instructor}</span>
                </div>
                <p className="figma-course-card__desc">{course.desc}</p>
                <div className="figma-course-card__rating">
                  <div className="figma-stars" aria-label={`Rating ${course.rating}`}>
                    {'★'.repeat(5)}
                  </div>
                  <span className="figma-reviews">({course.reviews})</span>
                </div>
                <div className="figma-course-card__price-row">
                  <span className="figma-price-current">{course.price}</span>
                  <span className="figma-price-original">{course.originalPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Popular Instructor (Figma Design) ── */}
      <section className="figma-section" aria-labelledby="heading-mentors">
        <div className="figma-section__header">
          <div>
            <h2 id="heading-mentors" className="figma-section__title">
              Popular Instructor
            </h2>
            <p className="figma-section__subtitle">
              We know the best things for You. Top picks for You.
            </p>
          </div>
        </div>

        <div className="figma-instructors-grid">
          {POPULAR_MENTORS.map((mentor) => (
            <div key={mentor.name} className="figma-instructor-card">
              <img src={mentor.image} alt={mentor.name} className="figma-instructor-card__img" />
              <div className="figma-instructor-card__overlay">
                <h3 className="figma-instructor-card__name">{mentor.name}</h3>
                <p className="figma-instructor-card__role">{mentor.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Newsletter / Discount CTA Banner (Figma Design) ── */}
      <section className="figma-newsletter-banner" aria-label="Discount Community">
        <div className="figma-newsletter-banner__content">
          <h2 className="figma-newsletter-banner__title">
            {language === 'vi' ? 'Nhận thông tin ưu đãi và bài học mới nhất' : 'Join and get amazing discount'}
          </h2>
          <p className="figma-newsletter-banner__subtitle">
            {language === 'vi'
              ? 'Trải nghiệm học tiếng Anh mượt mà trên cả trình duyệt máy tính và thiết bị di động'
              : 'With our responsive themes and mobile and desktop apps'}
          </p>

          <form onSubmit={handleSubscribe} className="figma-newsletter-banner__form">
            <div className="figma-newsletter-banner__input-wrap">
              <input
                type="email"
                placeholder={language === 'vi' ? 'Nhập email của bạn...' : 'Email Address'}
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                required
              />
              <span className="material-symbols-outlined figma-newsletter-banner__search-icon">search</span>
            </div>
            <button type="submit" className="figma-newsletter-banner__submit">
              {language === 'vi' ? 'Đăng ký' : 'Subscribe'}
            </button>
          </form>

          {subscribeStatus && (
            <p className="figma-newsletter-banner__status">{subscribeStatus}</p>
          )}
        </div>
      </section>
    </div>
  )
}
