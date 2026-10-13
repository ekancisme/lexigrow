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
            Cras nisi suspendisse sit semper. Massa erat volutpat volutpat id suspendisse tristique cras a consequat.
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
              At egestas bibendum sed auctor natoque vitae pulvinar in fringilla. Consequat non sapien velit donec neque. Pellentesque ornare nam purus ut vitae. Aliquet a ut bibendum ut risus cursus elementum. Vitae dignissim mi elementum eget faucibus.
            </p>
            <p className="eduvia-course-body">
              Pharetra pretium risus cursus commodo lacinia sagittis mauris. Consequat sed sed habitasse id consectetur. Mi ipsum sed blandit tincidunt neque placerat. Non egestas elementum ut scelerisque at lacus urna cras. Vitae aliquam sociis viverra amet cras egestas tortor quis. A in in sed cursus tempor id amet elit.
            </p>

            <div className="eduvia-learn-box">
              <h3 className="eduvia-learn-title">What You'll Learn</h3>
              <div className="eduvia-learn-grid">
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Semper bibendum egestas dui aliquam sapien lorem purus.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Semper bibendum egestas dui aliquam sapien lorem purus.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Semper bibendum egestas dui aliquam sapien lorem purus.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Semper bibendum egestas dui aliquam sapien lorem purus.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Semper bibendum egestas dui aliquam sapien lorem purus.</span>
                </div>
                <div className="eduvia-learn-item">
                  <span className="material-symbols-outlined">check</span>
                  <span>Semper bibendum egestas dui aliquam sapien lorem purus.</span>
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
              Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
            </p>
          </div>

          <div className="eduvia-steps-grid">
            <div className="eduvia-step-card">
              <span className="eduvia-step-num">01</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Choose Course</h3>
              <p className="eduvia-step-desc">
                Sit quis dui neque ullamcorper vitae est lorem nullam. Et lorem mattis viverra iaculis at varius.
              </p>
              <Link to="/student/explore" className="eduvia-step-link">Start Here</Link>
            </div>

            <div className="eduvia-step-card">
              <span className="eduvia-step-num">02</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Join Class</h3>
              <p className="eduvia-step-desc">
                Sit quis dui neque ullamcorper vitae est lorem nullam. Et lorem mattis viverra iaculis at varius.
              </p>
              <Link to="/pricing" className="eduvia-step-link">Enroll Now</Link>
            </div>

            <div className="eduvia-step-card">
              <span className="eduvia-step-num">03</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Learn & Practice</h3>
              <p className="eduvia-step-desc">
                Sit quis dui neque ullamcorper vitae est lorem nullam. Et lorem mattis viverra iaculis at varius.
              </p>
              <Link to="/student/writing" className="eduvia-step-link">Start Practice</Link>
            </div>

            <div className="eduvia-step-card">
              <span className="eduvia-step-num">04</span>
              <span className="eduvia-step-dot" />
              <h3 className="eduvia-step-title">Track Progress</h3>
              <p className="eduvia-step-desc">
                Sit quis dui neque ullamcorper vitae est lorem nullam. Et lorem mattis viverra iaculis at varius.
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
