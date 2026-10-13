import { Link } from 'react-router-dom'
import './AboutUs.css'

const MILESTONES = [
  {
    year: '2022',
    title: 'Starting The Vision',
    desc: 'Khởi động dự án LexiGrow với sứ mệnh giúp người học tiếng Anh làm chủ từ vựng và phản xạ ngôn ngữ thông qua thuật toán Spaced Repetition (SRS) khoa học.',
    image: '/assets/eduvia/image-13.jpg',
  },
  {
    year: '2024',
    title: 'AI Feedback Integration',
    desc: 'Tích hợp trợ lý trí tuệ nhân tạo chấm chữa bài viết luận tức thì, phân tích ngữ pháp chuyên sâu và gợi ý từ vựng học thuật theo chuẩn CEFR & IELTS.',
    image: '/assets/eduvia/image-4.jpg',
  },
  {
    year: '2026',
    title: 'Comprehensive Learning Ecosystem',
    desc: 'Mở rộng hệ sinh thái kết nối học viên, phụ huynh và giáo viên với hơn 12,000 người học tích cực, tích hợp quản lý lớp học và thanh toán số PayOS tiện lợi.',
    image: '/assets/eduvia/image-18.jpg',
  },
]

const CORE_VALUES = [
  {
    icon: 'navigation',
    title: 'Personalized Path',
    desc: 'Lộ trình học tập thông minh tự động thích ứng với tốc độ tiếp thu và mục tiêu cụ thể của từng học viên.',
  },
  {
    icon: 'school',
    title: 'Expert Educators',
    desc: 'Đội ngũ giáo viên và cố vấn học thuật giàu kinh nghiệm, đạt chứng chỉ giảng dạy quốc tế TESOL/CELTA.',
  },
  {
    icon: 'play_arrow',
    title: 'Practical Learning',
    desc: 'Phương pháp học thông qua bài tập thực tế, viết luận tương tác và mini-game rèn luyện phản xạ ngôn ngữ.',
  },
  {
    icon: 'trending_up',
    title: 'Progress Tracking',
    desc: 'Hệ thống báo cáo chi tiết theo dõi tỷ lệ nhớ từ, điểm bài viết và biểu đồ tiến bộ học tập từng ngày.',
  },
  {
    icon: 'calendar_month',
    title: 'Flexible Schedule',
    desc: 'Chủ động học mọi lúc mọi nơi trên cả máy tính và điện thoại, dễ dàng duy trì chuỗi học tập bền vững.',
  },
  {
    icon: 'favorite',
    title: 'Engaging Content',
    desc: 'Kho học liệu trực quan, sinh động, kết hợp khu vườn phát triển Growth Garden giúp việc học không nhàm chán.',
  },
]

const FEATURED_TEACHERS = [
  {
    name: 'Emma Collins',
    badge: 'Senior English Instructor',
    image: '/assets/eduvia/image-19.jpg',
    courses: '12 Courses',
    students: '3,200+ Students',
    desc: 'Chuyên gia sư phạm với hơn 10 năm kinh nghiệm giảng dạy tiếng Anh giao tiếp và xây dựng lộ trình bứt phá phản xạ tự nhiên.',
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

export default function AboutUs() {
  return (
    <div className="eduvia-page eduvia-about">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">About Us</h1>
          <p className="eduvia-page-header__desc">
            Tìm hiểu câu chuyện sứ mệnh, giá trị cốt lõi và đội ngũ phát triển nền tảng học tiếng Anh thông minh LexiGrow.
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">Home</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>About Us</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: EMPOWERING STUDENTS (SPLIT) ── */}
        <section className="eduvia-split-story">
          <div className="eduvia-split-story__visual">
            <img
              src="/assets/eduvia/image-23.png"
              alt="Happy student with backpack and phone"
              className="eduvia-split-story__img"
            />
          </div>
          <div className="eduvia-split-story__copy">
            <span className="eduvia-kicker eduvia-kicker--green">Who We Are</span>
            <h2 className="eduvia-section-title">
              Empowering Students With Better English Skills
            </h2>
            <p className="eduvia-section-desc">
              LexiGrow kết hợp phương pháp Spaced Repetition khoa học cùng trí tuệ nhân tạo AI nhằm mang lại môi trường học tiếng Anh cá nhân hóa, giúp người học ghi nhớ sâu và tự tin ứng dụng ngôn ngữ trong đời sống.
            </p>
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--lime">
              Khám phá khóa học
            </Link>

            <div className="eduvia-stat-row">
              <div className="eduvia-stat-item">
                <span className="eduvia-stat-num">850+</span>
                <span className="eduvia-stat-lbl">Completed Course Modules</span>
              </div>
              <div className="eduvia-stat-item">
                <span className="eduvia-stat-num">320+</span>
                <span className="eduvia-stat-lbl">Professional English Tutors</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: OUR STORY / MILESTONES ── */}
        <section className="eduvia-milestones-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--blue">Our Story</span>
              <h2 className="eduvia-section-title">Journey Behind Our Growing Vision</h2>
            </div>
            <p className="eduvia-section-header__desc">
              Hành trình kiên định của LexiGrow từ những bước đầu tiên đến khi trở thành giải pháp học tiếng Anh tin cậy cho hàng nghìn học viên.
            </p>
          </div>

          <div className="eduvia-milestones-grid">
            {MILESTONES.map((item, idx) => (
              <div key={idx} className="eduvia-milestone-card">
                <div className="eduvia-milestone-card__thumb">
                  <img src={item.image} alt={item.title} />
                  <div className="eduvia-milestone-card__play">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </div>
                </div>
                <div className="eduvia-milestone-card__meta">
                  <h3 className="eduvia-milestone-card__title">{item.title}</h3>
                  <span className="eduvia-milestone-card__year">{item.year}</span>
                </div>
                <p className="eduvia-milestone-card__desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: TEACHING EXPERTISE & PROGRESS BARS ── */}
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
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--mint">
              Explore Courses
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

        {/* ── SECTION 4: GUIDING PRINCIPLES / CORE VALUES ── */}
        <section className="eduvia-values-section">
          <div className="eduvia-section-header eduvia-section-header--center">
            <span className="eduvia-kicker eduvia-kicker--blue">Core Values</span>
            <h2 className="eduvia-section-title">Guiding Principles For Better Learning</h2>
          </div>

          <div className="eduvia-values-grid">
            {CORE_VALUES.map((val, idx) => (
              <div key={idx} className="eduvia-value-card">
                <div className="eduvia-value-card__icon">
                  <span className="material-symbols-outlined">{val.icon}</span>
                </div>
                <h3 className="eduvia-value-card__title">{val.title}</h3>
                <p className="eduvia-value-card__desc">{val.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: DEDICATED TEACHERS ── */}
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
