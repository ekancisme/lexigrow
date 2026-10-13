import { useState } from 'react'
import { Link } from 'react-router-dom'
import './TeachersPage.css'

const TEACHERS = [
  {
    name: 'Emma Collins',
    badge: 'Senior English Instructor',
    image: '/assets/eduvia/image-19.jpg',
    courses: '12 Courses',
    students: '3,200+ Students',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
  },
  {
    name: 'Daniel Hughes',
    badge: 'Grammar & Writing Coach',
    image: '/assets/eduvia/image-20.jpg',
    courses: '10 Courses',
    students: '2,900+ Students',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
  },
  {
    name: 'Sophia Ramirez',
    badge: 'Speaking & Pronunciation Expert',
    image: '/assets/eduvia/image-21.jpg',
    courses: '8 Courses',
    students: '2,600+ Students',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
  },
  {
    name: 'Michael Turner',
    badge: 'Business English Specialist',
    image: '/assets/eduvia/image-22.jpg',
    courses: '14 Courses',
    students: '3,500+ Students',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
  },
  {
    name: 'Maria Santos',
    badge: 'Exam Preparation Coach',
    image: '/assets/eduvia/image-24.jpg',
    courses: '9 Courses',
    students: '2,400+ Students',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
  },
  {
    name: 'Ethan Walker',
    badge: 'Vocabulary & Reading Instructor',
    image: '/assets/eduvia/image-25.jpg',
    courses: '7 Courses',
    students: '1,800+ Students',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
  },
]

const MILESTONES = [
  {
    year: '2018',
    title: 'Starting The Vision',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
    image: '/assets/eduvia/image-13.jpg',
  },
  {
    year: '2020',
    title: 'Building The Foundation',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
    image: '/assets/eduvia/image-4.jpg',
  },
  {
    year: '2023',
    title: 'Reaching New Milestones',
    desc: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci.',
    image: '/assets/eduvia/image-18.jpg',
  },
]

const CORE_VALUES = [
  { icon: 'navigation', title: 'Personalized Path', desc: 'Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.' },
  { icon: 'school', title: 'Expert Teachers', desc: 'Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.' },
  { icon: 'play_arrow', title: 'Practical Learning', desc: 'Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.' },
  { icon: 'trending_up', title: 'Progress Tracking', desc: 'Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.' },
  { icon: 'calendar_month', title: 'Flexible Schedule', desc: 'Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.' },
  { icon: 'favorite', title: 'Engaging Content', desc: 'Massa quam porta eget mauris ut. Elit consequat eget sed facilisis libero vulputate mattis. Ornare dui senectus neque sit augue feugiat.' },
]

export default function TeachersPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="eduvia-page eduvia-teachers-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">Teachers</h1>
          <p className="eduvia-page-header__desc">
            Cras nisi suspendisse sit semper. Massa erat volutpat volutpat id suspendisse tristique cras a consequat.
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">Home</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>Teachers</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: 6 TEACHERS GRID ── */}
        <section className="eduvia-teachers-full-grid">
          {TEACHERS.map((teacher, idx) => (
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
        </section>

        {/* ── SECTION 2: OUR STORY / MILESTONES ── */}
        <section className="eduvia-milestones-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--blue">Our Story</span>
              <h2 className="eduvia-section-title">Journey Behind Our Growing Vision</h2>
            </div>
            <p className="eduvia-section-header__desc">
              Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
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
              Explore Expertise
            </Link>
          </div>

          <div className="eduvia-expertise-col eduvia-expertise-col--content">
            <span className="eduvia-kicker eduvia-kicker--green">Teaching Expertise</span>
            <h2 className="eduvia-section-title">Quality English Learning You Can Trust</h2>
            <p className="eduvia-section-desc">
              Pretium lectus mauris commodo viverra orci. Ut dapibus vestibulum mollis neque. Rutrum risus duis vulputate phasellus.
            </p>
            <p className="eduvia-section-desc">
              Pharetra pretium risus cursus commodo lacinia sagittis mauris. Consequat sed sed habitasse id consectetur. Mi ipsum sed blandit tincidunt neque placerat. Non egestas elementum ut scelerisque at lacus urna cras. Vitae aliquam sociis viverra amet cras egestas tortor quis. A in in sed cursus tempor id amet elit.
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

        {/* ── SECTION 5: CONNECT WITH OUR SUPPORT TEAM (FORM) ── */}
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

        {/* ── SECTION 6: PARTNER LOGOS ── */}
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
