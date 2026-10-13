import { Link } from 'react-router-dom'
import './TestimonialsPage.css'

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Daniel K.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Mia L.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Jonathan P.',
    course: 'Speaking Course',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Aisha R.',
    course: 'IELTS Prep',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Kevin S.',
    course: 'Writing Course',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Hana T.',
    course: 'Vocabulary Course',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
  {
    name: 'Leo D.',
    course: 'TOEFL Prep',
    rating: '4.8/5',
    quote: 'Duis sem quis eu faucibus et cras aliquet convallis. Viverra velit quis dui bibendum. Sodales semper et ac mauris. Blandit et ac eu scelerisque orci. Congue erat nisi vitae eget nibh.',
  },
]

const FEATURED_TEACHERS = [
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
]

export default function TestimonialsPage() {
  return (
    <div className="eduvia-page eduvia-testimonials-page">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">Testimonials</h1>
          <p className="eduvia-page-header__desc">
            Cras nisi suspendisse sit semper. Massa erat volutpat volutpat id suspendisse tristique cras a consequat.
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
              Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
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
              <p>Fast Learning Method</p>
            </div>
          </div>
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">group</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Peer Learning</h3>
              <p>Supportive Study Community</p>
            </div>
          </div>
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">bolt</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Instant Correction</h3>
              <p>Smart Feedback System</p>
            </div>
          </div>
          <div className="eduvia-features-bar__item">
            <span className="eduvia-features-bar__icon"><span className="material-symbols-outlined">calendar_today</span></span>
            <div className="eduvia-features-bar__text">
              <h3>Guided Routine</h3>
              <p>Consistent Weekly Plan</p>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: DUAL PROMO SPLIT ── */}
        <section className="eduvia-promo-split" aria-label="Special Offers">
          <div className="eduvia-promo-card eduvia-promo-card--photo">
            <img src="/assets/eduvia/image-14.jpg" alt="Students studying together" className="eduvia-promo-card__bg-img" />
            <div className="eduvia-promo-badge-rating">
              <div className="eduvia-promo-badge-rating__score">4.9/5 ★</div>
              <div className="eduvia-promo-badge-rating__label">Average Student Rating</div>
            </div>
          </div>

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
              Pretium lectus mauris commodo viverra orci. Ut dapibus vestibulum mollis neque. Rutrum risus duis vulputate phasellus.
            </p>
            <p className="eduvia-section-desc">
              Pharetra pretium risus cursus commodo lacinia sagittis mauris. Consequat sed sed habitasse id consectetur. Mi ipsum sed blandit tincidunt neque placerat. Non egestas elementum ut scelerisque at lacus urna cras.
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
              Sed luctus velit vulputate augue viverra fermentum blandit rhoncus risus. Nibh malesuada donec eu congue auctor turpis. Sit leo pharetra id magna nisi mauris.
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
