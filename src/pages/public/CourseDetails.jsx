import { Link } from 'react-router-dom'
import './CourseDetails.css'

const OTHER_COURSES = [
  {
    id: 'pronunciation-coach',
    tag: 'Pronunciation',
    image: '/assets/eduvia/image-7.jpg',
    price: '$39',
    title: 'Master Clear English Pronunciation With Guided Practice And Expert Coaching',
    lessons: '18 Lessons',
    students: '3,200 Students',
  },
  {
    id: 'speaking-skills-pro',
    tag: 'Grammar',
    image: '/assets/eduvia/image-8.jpg',
    price: '$45',
    title: 'Improve Your English Speaking Skills For Confident Daily Communication',
    lessons: '30 Lessons',
    students: '5,600 Students',
  },
  {
    id: 'academic-writing',
    tag: 'Writing',
    image: '/assets/eduvia/image-9.jpg',
    price: '$42',
    title: 'Build Strong Academic Writing Skills For Essays Reports And Research',
    lessons: '20 Lessons',
    students: '2,750 Students',
  },
]

export default function CourseDetails() {
  const courseTitle = 'Improve Your English Speaking Skills For Confident Daily Communication'

  return (
    <div className="eduvia-page eduvia-course-details">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">Course Details</h1>
          <p className="eduvia-page-header__desc">
            Khám phá chi tiết chương trình học tiếng Anh bài bản với lộ trình tinh gọn, học liệu chuẩn quốc tế và trợ lý AI đồng hành.
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">Home</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>Course Details</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── MAIN DETAIL SPLIT ── */}
        <section className="eduvia-course-split">
          <div className="eduvia-course-main">
            <div className="eduvia-course-rating-row">
              <span className="eduvia-course-score">4.8</span>
              <div className="eduvia-stars">★★★★★</div>
              <span className="eduvia-course-review-count">(5.8K+)</span>
            </div>

            <h2 className="eduvia-course-headline">{courseTitle}</h2>

            <p className="eduvia-course-body">
              Khóa học được thiết kế chuyên biệt nhằm giúp học viên xây dựng sự tự tin và phản xạ giao tiếp tự nhiên trong công việc, học tập và các kỳ thi quốc tế. Kết hợp giữa học liệu chuẩn CEFR và bài tập thực hành theo ngữ cảnh, bạn sẽ nhanh chóng vượt qua rào cản ngại nói và phát âm không chuẩn.
            </p>
            <p className="eduvia-course-body">
              Mỗi bài học đều tích hợp công nghệ AI nhận diện ngữ pháp và chấm điểm bài viết tức thì, đi kèm thuật toán Spaced Repetition (SRS) giúp củng cố từ vựng bền vững vào trí nhớ dài hạn mà không lo tình trạng học trước quên sau.
            </p>

            <div className="eduvia-learn-box">
              <h3 className="eduvia-learn-title">What You'll Learn</h3>
              <div className="eduvia-learn-grid">
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Phát âm chuẩn bảng ký hiệu IPA và ngữ điệu tự nhiên như người bản xứ.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Mở rộng hơn 1,500 từ vựng cốt lõi theo chủ đề với thuật toán Spaced Repetition.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Cải thiện cấu trúc ngữ pháp ứng dụng và độ chính xác trong giao tiếp hàng ngày.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Rèn luyện phản xạ hội thoại linh hoạt qua các tình huống phỏng vấn và thuyết trình.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Tiếp cận kho bài tập viết luận tương tác và nhận phản hồi tức thì từ trợ lý AI.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Theo dõi tiến độ học tập minh bạch qua bảng điều khiển và biểu đồ kỹ năng.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Card */}
          <aside className="eduvia-course-sidebar">
            <div className="eduvia-course-card-sticky">
              <div className="eduvia-course-card-thumb">
                <span className="eduvia-badge-pill">Speaking</span>
                <img src="/assets/eduvia/image-6.jpg" alt={courseTitle} />
              </div>
              <div className="eduvia-course-card-details">
                <ul className="eduvia-course-facts">
                  <li>
                    <span className="eduvia-bullet-dot" />
                    <strong>Level:</strong> Beginner / Intermediate
                  </li>
                  <li>
                    <span className="eduvia-bullet-dot" />
                    <strong>Duration:</strong> 4-6 Weeks
                  </li>
                  <li>
                    <span className="eduvia-bullet-dot" />
                    <strong>Students:</strong> 3,200+ Enrolled
                  </li>
                </ul>

                <Link to="/pricing" className="eduvia-btn eduvia-btn--lime eduvia-btn--block">
                  Start Learning Today
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {/* ── SECTION 2: SIMPLE STEPS TO START LEARNING (HOW IT WORKS) ── */}
        <section className="eduvia-steps-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--blue">How It Works</span>
              <h2 className="eduvia-section-title">Simple Steps To Start Learning</h2>
            </div>
            <p className="eduvia-section-header__desc">
              Bốn bước tinh gọn giúp bạn dễ dàng bắt đầu và đạt được mục tiêu tiếng Anh cùng LexiGrow.
            </p>
          </div>

          <div className="eduvia-steps-grid">
            <div className="eduvia-step-card">
              <span className="eduvia-step-num">01</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Choose Course</h3>
              <p className="eduvia-step-desc">
                Lựa chọn học phần phù hợp với mục tiêu cá nhân và làm bài kiểm tra xác định trình độ ban đầu.
              </p>
              <Link to="/student/explore" className="eduvia-step-link">Start Here</Link>
            </div>

            <div className="eduvia-step-card">
              <span className="eduvia-step-num">02</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Join Class</h3>
              <p className="eduvia-step-desc">
                Kích hoạt lộ trình học tập, nhận tài liệu học chuẩn hóa và nhận sự đồng hành từ giáo viên.
              </p>
              <Link to="/pricing" className="eduvia-step-link">Enroll Now</Link>
            </div>

            <div className="eduvia-step-card">
              <span className="eduvia-step-num">03</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Learn & Practice</h3>
              <p className="eduvia-step-desc">
                Luyện viết luận, làm bài tập trắc nghiệm và ôn thẻ từ vựng ngắt quãng mỗi ngày cùng AI.
              </p>
              <Link to="/student/writing" className="eduvia-step-link">Start Practice</Link>
            </div>

            <div className="eduvia-step-card">
              <span className="eduvia-step-num">04</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Track Progress</h3>
              <p className="eduvia-step-desc">
                Xem chi tiết tỷ lệ nhớ từ, điểm chấm bài luận và nhận chứng chỉ hoàn thành sau khóa học.
              </p>
              <Link to="/student/progress" className="eduvia-step-link">View Progress</Link>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: OTHER COURSES ── */}
        <section className="eduvia-other-courses">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--green">Other Courses</span>
              <h2 className="eduvia-section-title">Build English Skills With Expert Lessons</h2>
            </div>
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--mint">
              View All Courses
            </Link>
          </div>

          <div className="eduvia-courses-grid">
            {OTHER_COURSES.map(course => (
              <div key={course.id} className="eduvia-course-card">
                <div className="eduvia-course-card__media">
                  <span className="eduvia-course-card__badge">{course.tag}</span>
                  <img src={course.image} alt={course.title} />
                </div>
                <div className="eduvia-course-card__body">
                  <div className="eduvia-course-card__meta-top">
                    <div className="eduvia-course-card__stars">★★★★★</div>
                    <span className="eduvia-course-card__price">{course.price}</span>
                  </div>
                  <h3 className="eduvia-course-card__title">
                    <Link to={`/course/${course.id}`}>{course.title}</Link>
                  </h3>
                  <div className="eduvia-course-card__meta-bottom">
                    <span>
                      <span className="material-symbols-outlined">menu_book</span>
                      {course.lessons}
                    </span>
                    <span>
                      <span className="material-symbols-outlined">group</span>
                      {course.students}
                    </span>
                  </div>
                  <Link to="/pricing" className="eduvia-btn eduvia-btn--navy eduvia-btn--block">
                    Enroll Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
