import { Link } from 'react-router-dom'
import './TestimonialsPage.css'

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quote: 'Phương pháp Spaced Repetition kết hợp cùng trợ lý phát âm AI đã giúp mình tự tin phản xạ tiếng Anh trôi chảy chỉ sau 3 tháng.',
  },
  {
    name: 'Daniel K.',
    course: 'IELTS Writing',
    rating: '4.9/5',
    quote: 'Tính năng AI chấm bài viết chỉ ra chi tiết từng lỗi ngữ pháp và cách dùng từ vựng band 7.5+. Điểm Writing của mình tăng từ 5.5 lên 7.0!',
  },
  {
    name: 'Mia L.',
    course: 'Daily Conversation',
    rating: '4.8/5',
    quote: 'Giao diện cực kỳ hiện đại, lộ trình học từng ngày trực quan. Các bài ôn flashcard và game Vocab Hunter tạo động lực học rất lớn.',
  },
  {
    name: 'Jonathan P.',
    course: 'Business English',
    rating: '4.9/5',
    quote: 'Khóa học tiếng Anh thương mại rất sát với công việc thực tế. Báo cáo tiến độ chi tiết giúp mình duy trì kỷ luật học tập hàng ngày.',
  },
  {
    name: 'Aisha R.',
    course: 'IELTS Prep',
    rating: '5.0/5',
    quote: 'Hệ thống bài tập phân loại theo khung CEFR và tiêu chí IELTS rõ ràng. Mình đã đạt mục tiêu 7.5 IELTS ngay trong lần thi đầu tiên.',
  },
  {
    name: 'Kevin S.',
    course: 'Academic Writing',
    rating: '4.8/5',
    quote: 'Trước đây viết luận tiếng Anh là nỗi sợ lớn, nhưng nhờ gợi ý từ vựng và phân tích mạch lạc của LexiGrow, mình tự tin hoàn thành bài luận đại học.',
  },
  {
    name: 'Hana T.',
    course: 'Vocabulary Mastery',
    rating: '4.9/5',
    quote: 'Nhớ hơn 1,200 từ vựng chuyên ngành nhờ thuật toán Spaced Repetition của LexiGrow. Rất đáng trải nghiệm cho mọi người!',
  },
  {
    name: 'Leo D.',
    course: 'TOEFL Prep',
    rating: '4.8/5',
    quote: 'Các bài kiểm tra định kỳ và đánh giá năng lực giúp mình biết rõ điểm yếu cần củng cố. Đây là nền tảng học tiếng Anh tốt nhất mình từng dùng.',
  },
]

const FEATURED_TEACHERS = [
  {
    name: 'Emma Collins',
    badge: 'Senior English Instructor',
    image: '/assets/eduvia/image-19.jpg',
    courses: '12 Courses',
    students: '3,200+ Students',
    desc: 'Hơn 10 năm kinh nghiệm giảng dạy tiếng Anh giao tiếp và xây dựng lộ trình bứt phá phản xạ ngôn ngữ tự nhiên.',
  },
  {
    name: 'Daniel Hughes',
    badge: 'Grammar & Writing Coach',
    image: '/assets/eduvia/image-20.jpg',
    courses: '10 Courses',
    students: '2,900+ Students',
    desc: 'Cố vấn chuyên sâu về cấu trúc ngữ pháp học thuật và phương pháp viết luận chuẩn mực cho các kỳ thi quốc tế IELTS/TOEFL.',
  },
  {
    name: 'Sophia Ramirez',
    badge: 'Speaking & Pronunciation Expert',
    image: '/assets/eduvia/image-21.jpg',
    courses: '8 Courses',
    students: '2,600+ Students',
    desc: 'Chuyên gia huấn luyện phát âm chuẩn bảng ký hiệu IPA, ngữ điệu tự nhiên và sự tự tin khi thuyết trình tiếng Anh.',
  },
]

export default function TestimonialsPage() {
  return (
    <div className="eduvia-page eduvia-testimonials-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">Testimonials</h1>
          <p className="eduvia-page-header__desc">
            Lắng nghe chia sẻ và kết quả học tập thực tế từ các học viên đã đồng hành và tiến bộ vượt bậc cùng LexiGrow.
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">Home</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>Testimonials</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: 8 TESTIMONIALS GRID (4x2) ── */}
        <section className="eduvia-testimonials-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--green">Student Voices</span>
              <h2 className="eduvia-section-title">Real Stories From Our English Learners</h2>
            </div>
            <p className="eduvia-section-header__desc">
              Những trải nghiệm chân thực từ người học đã tự tin giao tiếp và nâng cao band điểm cùng LexiGrow.
            </p>
          </div>

          <div className="eduvia-testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="eduvia-testi-card">
                <div className="eduvia-testi-card__top">
                  <div className="eduvia-testi-card__stars">★★★★★</div>
                  <span className="eduvia-testi-card__score">{t.rating}</span>
                </div>
                <p className="eduvia-testi-card__quote">{t.quote}</p>
                <div className="eduvia-testi-card__bottom">
                  <strong className="eduvia-testi-card__name">{t.name}</strong>
                  <span className="eduvia-testi-card__badge">{t.course}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 2: VIDEO SHOWCASE BANNER ── */}
        <section className="eduvia-video-banner">
          <img src="/assets/eduvia/image-18.jpg" alt="Learners collaborating" />
          <div className="eduvia-video-banner__overlay">
            <div className="eduvia-play-bubble">
              <span className="material-symbols-outlined">play_arrow</span>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: 4 FEATURES BAR ── */}
        <section className="eduvia-features-bar" aria-label="Core Benefits">
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">menu_book</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Quick Progress</h3>
              <p>Lộ trình học tập tăng tốc</p>
            </div>
          </div>
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">group</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Peer Learning</h3>
              <p>Cộng đồng học viên tích cực</p>
            </div>
          </div>
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">bolt</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Instant Correction</h3>
              <p>Trợ lý AI chấm sửa tức thì</p>
            </div>
          </div>
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">calendar_today</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Guided Routine</h3>
              <p>Thói quen học tập bền vững</p>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: DUAL PROMO SPLIT ── */}
        <section className="eduvia-promo-split" aria-label="Special Offers">
          <div className="eduvia-promo-card eduvia-promo-card--photo">
            <img src="/assets/eduvia/image-14.jpg" alt="Students studying together" className="eduvia-promo-card__bg-img" />
            <div className="eduvia-promo-badge-rating">
              <div className="eduvia-promo-badge-rating__score">4.9/5 ★</div>
              <div className="eduvia-promo-badge-rating__label">Đánh giá trung bình từ học viên</div>
            </div>
          </div>

          <div className="eduvia-promo-card eduvia-promo-card--navy">
            <div className="eduvia-promo-card__content">
              <span className="eduvia-pill-badge eduvia-pill-badge--green">Save Big</span>
              <h2>Nâng tầm tiếng Anh với ưu đãi đặc biệt</h2>
              <p>
                Đăng ký ngay hôm nay để nhận ưu đãi hấp dẫn cho các gói học tập cao cấp cùng LexiGrow.
              </p>
              <Link to="/pricing" className="eduvia-btn eduvia-btn--lime">
                Xem ưu đãi gói học
              </Link>
            </div>
            <div className="eduvia-promo-card__cutout">
              <img src="/assets/eduvia/image-23.png" alt="Happy student with laptop" />
            </div>
          </div>
        </section>

        {/* ── SECTION 5: TEACHING EXPERTISE ── */}
        <section className="eduvia-expertise-section">
          <div className="eduvia-expertise-col">
            <div className="eduvia-expertise-photo">
              <img src="/assets/eduvia/image-14.jpg" alt="Teacher explaining English" />
            </div>
            <div className="eduvia-expertise-progress">
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>Speaking Fluency</span>
                  <span>92%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>Grammar Accuracy</span>
                  <span>88%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '88%' }} />
                </div>
              </div>
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>Vocabulary Growth</span>
                  <span>94%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '94%' }} />
                </div>
              </div>
            </div>
            <Link to="/teachers" className="eduvia-btn eduvia-btn--mint">
              Explore Expertise
            </Link>
          </div>

          <div className="eduvia-expertise-col eduvia-expertise-col--content">
            <span className="eduvia-kicker eduvia-kicker--green">Teaching Expertise</span>
            <h2 className="eduvia-section-title">Quality English Learning You Can Trust</h2>
            <p className="eduvia-section-desc">
              Chương trình học tập tại LexiGrow được kiểm định kỹ lưỡng, kết hợp các phương pháp sư phạm hiện đại cùng phản hồi AI thông minh giúp học viên tiến bộ rõ rệt qua từng bài học.
            </p>
            <p className="eduvia-section-desc">
              Từ phát âm phản xạ đến viết luận chuyên sâu, chúng tôi cam kết đem lại trải nghiệm học tập chuẩn mực, minh bạch về kết quả và bền vững theo thời gian.
            </p>
            <div className="eduvia-expertise-duo">
              <img src="/assets/eduvia/image-16.jpg" alt="Mentoring student" />
              <img src="/assets/eduvia/image-17.jpg" alt="Interactive session" />
            </div>
          </div>
        </section>

        {/* ── SECTION 6: DEDICATED TEACHERS ── */}
        <section className="eduvia-teachers-summary">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--blue">English Educators</span>
              <h2 className="eduvia-section-title">Dedicated Teachers For Better Learning</h2>
            </div>
            <p className="eduvia-section-header__desc">
              Đội ngũ giảng viên tâm huyết luôn sẵn sàng đồng hành, chia sẻ kiến thức và định hướng cho bạn trên con đường chinh phục tiếng Anh.
            </p>
          </div>

          <div className="eduvia-teachers-grid">
            {FEATURED_TEACHERS.map((teacher, idx) => (
              <div key={idx} className="eduvia-teacher-card">
                <div className="eduvia-teacher-card__media">
                  <span className="eduvia-teacher-badge">{teacher.badge}</span>
                  <img src={teacher.image} alt={teacher.name} />
                </div>
                <div className="eduvia-teacher-card__info">
                  <h3 className="eduvia-teacher-card__name">{teacher.name}</h3>
                  <div className="eduvia-teacher-card__stats">
                    <span className="eduvia-stat-tag eduvia-stat-tag--purple">
                      <span className="material-symbols-outlined">menu_book</span>
                      {teacher.courses}
                    </span>
                    <span className="eduvia-stat-tag eduvia-stat-tag--green">
                      <span className="material-symbols-outlined">person</span>
                      {teacher.students}
                    </span>
                  </div>
                  <p className="eduvia-teacher-card__desc">{teacher.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
