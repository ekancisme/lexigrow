import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './AboutUs.css'

export default function AboutUs() {
  const { t, language } = useLanguage()

  const MILESTONES = [
    {
      year: t('about.milestone1Year', '2023'),
      title: t('about.milestone1Title', 'SRS Algorithm & Core Vocabulary Engine'),
      desc: t('about.milestone1Desc', 'Developed the Ebbinghaus adaptive revision scheduler, ensuring words are reviewed at the mathematically optimal forgetting curve interval.'),
      image: '/assets/lexigrow/tutor-guidance.webp',
    },
    {
      year: t('about.milestone2Year', '2024'),
      title: t('about.milestone2Title', 'Real-Time AI Writing & IELTS 4-Criteria Evaluation'),
      desc: t('about.milestone2Desc', 'Integrated LLM intelligence to evaluate student essays against Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range.'),
      image: '/assets/lexigrow/writing-practice.webp',
    },
    {
      year: t('about.milestone3Year', '2025'),
      title: t('about.milestone3Title', 'Multi-Role Ecosystem & Instant PayOS Activation'),
      desc: t('about.milestone3Desc', 'Unified teacher classroom management, early warning at-risk student alerts, parent tracking, and automated 24/7 bank QR payments.'),
      image: '/assets/lexigrow/study-group.webp',
    },
    {
      year: t('about.milestone4Year', '2026'),
      title: t('about.milestone4Title', 'Growth Garden & Gamified Habit Building'),
      desc: t('about.milestone4Desc', 'Launched Growth Garden, daily streaks, and arcade puzzle modes to cultivate long-term intrinsic study motivation.'),
      image: '/assets/eduvia/image-13.jpg',
    },
  ]

  const SYSTEM_PILLARS = [
    {
      icon: 'psychology',
      title: t('about.pillar1Title', 'Spaced Repetition System (SRS)'),
      desc: t('about.pillar1Desc', 'Automatic calculation of review intervals across 1, 3, 7, and 30-day horizons so vocabulary moves permanently into long-term memory.'),
    },
    {
      icon: 'auto_fix_high',
      title: t('about.pillar2Title', 'AI Writing & Rubric Scoring'),
      desc: t('about.pillar2Desc', 'Context-aware corrections, synonym upgrades, CEFR level tagging, and actionable structural advice within 3 seconds of submission.'),
    },
    {
      icon: 'eco',
      title: t('about.pillar3Title', 'Growth Garden Gamification'),
      desc: t('about.pillar3Desc', 'Visual plant maturation, fireflies, streak tracking, and interactive word arcade games create positive dopamine reinforcement.'),
    },
    {
      icon: 'school',
      title: t('about.pillar4Title', 'Teacher & Classroom Suite'),
      desc: t('about.pillar4Desc', 'Create assignments with mandatory target vocabulary, monitor student submissions, customize AI system prompts, and get Early Warning Alerts.'),
    },
    {
      icon: 'family_restroom',
      title: t('about.pillar5Title', 'Parent Transparency Portal'),
      desc: t('about.pillar5Desc', "Real-time visibility into your child's weekly goals, essay progression, vocabulary acquisition curve, and learning alerts."),
    },
    {
      icon: 'payments',
      title: t('about.pillar6Title', 'VietQR PayOS Automation'),
      desc: t('about.pillar6Desc', 'Frictionless instant banking QR activation 24/7 without manual confirmation delays or foreign exchange fees.'),
    },
  ]

  return (
    <div className="eduvia-page eduvia-about">
      {/* ── BANNER HEADER ── */}
      <section className="eduvia-page-header">
        <div className="eduvia-page-header__inner">
          <h1 className="eduvia-page-header__title">{t('about.heroTitle', 'About LexiGrow')}</h1>
          <p className="eduvia-page-header__desc">
            {t('about.heroDesc', 'Learn how LexiGrow unites Spaced Repetition (SRS), real-time AI writing evaluation, and gamified habit building into an intelligent English mastery ecosystem.')}
          </p>
          <div className="eduvia-page-header__crumbs">
            <Link to="/student/home">{t('about.breadcrumbHome', 'Home')}</Link>
            <span className="eduvia-crumb-separator">-</span>
            <span>{t('about.breadcrumbAbout', 'About Us')}</span>
          </div>
        </div>
      </section>

      <div className="eduvia-page__content">
        {/* ── SECTION 1: WHO WE ARE (SPLIT) ── */}
        <section className="eduvia-split-story">
          <div className="eduvia-split-story__visual">
            <img
              src="/assets/lexigrow/study-hero.webp"
              alt="LexiGrow student learning English"
              className="eduvia-split-story__img"
            />
          </div>
          <div className="eduvia-split-story__copy">
            <span className="eduvia-kicker eduvia-kicker--green">{t('about.whoWeAreKicker', 'Who We Are')}</span>
            <h2 className="eduvia-section-title">
              {t('about.whoWeAreTitle', 'Empowering English Learners With Adaptive AI & Scientific Memory')}
            </h2>
            <p className="eduvia-section-desc">
              {t('about.whoWeAreDesc', 'LexiGrow was founded with a clear mission: to solve the disconnect between memorizing isolated vocabulary and applying words actively in academic essays. By combining Ebbinghaus-based Spaced Repetition (SRS) algorithms with instant AI writing evaluation, we empower students to remember longer, write clearer, and speak more confidently.')}
            </p>
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--lime">
              {t('about.whoWeAreCta', 'Explore Learning Topics')}
            </Link>

            <div className="eduvia-stat-row">
              <div className="eduvia-stat-item">
                <span className="eduvia-stat-num">15,000+</span>
                <span className="eduvia-stat-lbl">{t('about.statLearners', 'Active Learners')}</span>
              </div>
              <div className="eduvia-stat-item">
                <span className="eduvia-stat-num">85,000+</span>
                <span className="eduvia-stat-lbl">{t('about.statEssays', 'AI Essays Evaluated')}</span>
              </div>
              <div className="eduvia-stat-item">
                <span className="eduvia-stat-num">98%</span>
                <span className="eduvia-stat-lbl">{t('about.statRetention', 'Vocabulary Retention')}</span>
              </div>
              <div className="eduvia-stat-item">
                <span className="eduvia-stat-num">300+</span>
                <span className="eduvia-stat-lbl">{t('about.statClassrooms', 'Connected Classrooms')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: OUR STORY / MILESTONES ── */}
        <section className="eduvia-milestones-section">
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--blue">{t('about.storyKicker', 'Our Journey')}</span>
              <h2 className="eduvia-section-title">{t('about.storyTitle', 'From Academic Vision To An All-in-One Learning Ecosystem')}</h2>
            </div>
            <p className="eduvia-section-header__desc">
              {t('about.storyDesc', 'How LexiGrow evolved from an SRS vocabulary research project into a trusted ecosystem connecting learners, teachers, and parents.')}
            </p>
          </div>

          <div className="eduvia-milestones-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {MILESTONES.map((item, idx) => (
              <div key={idx} className="eduvia-milestone-card">
                <div className="eduvia-milestone-card__thumb">
                  <img src={item.image} alt={item.title} />
                  <div className="eduvia-milestone-card__play">
                    <span className="material-symbols-outlined">verified</span>
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
              <img src="/assets/lexigrow/writing-practice.webp" alt="Learner practising English writing with LexiGrow AI" />
            </div>
            <div className="eduvia-expertise-progress">
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>{t('about.metricFluency', 'Active Word Recall')}</span>
                  <span>96%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '96%' }} />
                </div>
              </div>
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>{t('about.metricGrammar', 'Grammar Accuracy Rate')}</span>
                  <span>92%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>{t('about.metricLexical', 'Lexical Diversity (TTR)')}</span>
                  <span>94%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '94%' }} />
                </div>
              </div>
              <div className="eduvia-progress-bar-item">
                <div className="eduvia-progress-bar-label">
                  <span>{t('about.metricWriting', 'Essay Scoring Progression')}</span>
                  <span>89%</span>
                </div>
                <div className="eduvia-progress-bar-track">
                  <div className="eduvia-progress-bar-fill" style={{ width: '89%' }} />
                </div>
              </div>
            </div>
            <Link to="/student/explore" className="eduvia-btn eduvia-btn--mint">
              {language === 'vi' ? 'Bắt đầu học ngay' : 'Start Learning Now'}
            </Link>
          </div>

          <div className="eduvia-expertise-col eduvia-expertise-col--content">
            <span className="eduvia-kicker eduvia-kicker--green">{t('about.techKicker', 'Core Technology')}</span>
            <h2 className="eduvia-section-title">{t('about.techTitle', 'Scientific Pedagogy Built Into Every Interaction')}</h2>
            <p className="eduvia-section-desc">
              {t('about.techDesc1', 'At LexiGrow, technology is guided by cognitive science. We eliminate passive rote memorization by forcing active retrieval and immediate production.')}
            </p>
            <p className="eduvia-section-desc">
              {t('about.techDesc2', 'Every vocabulary word learned feeds into your personalized essay prompt, and every essay written trains your personal lexical mastery model.')}
            </p>
            <div className="eduvia-expertise-duo">
              <img src="/assets/lexigrow/study-group.webp" alt="Learners reviewing vocabulary together" />
              <img src="/assets/lexigrow/tutor-guidance.webp" alt="Teacher mentoring a student" />
            </div>
          </div>
        </section>

        {/* ── SECTION 4: SYSTEM PILLARS & ARCHITECTURE ── */}
        <section className="eduvia-values-section">
          <div className="eduvia-section-header eduvia-section-header--center">
            <span className="eduvia-kicker eduvia-kicker--blue">{t('about.pillarsKicker', 'System Architecture')}</span>
            <h2 className="eduvia-section-title">{t('about.pillarsTitle', 'Architected For Mastery Across Every Learning Stage')}</h2>
          </div>

          <div className="eduvia-values-grid">
            {SYSTEM_PILLARS.map((pillar, idx) => (
              <div key={idx} className="eduvia-value-card">
                <div className="eduvia-value-card__icon">
                  <span className="material-symbols-outlined">{pillar.icon}</span>
                </div>
                <h3 className="eduvia-value-card__title">{pillar.title}</h3>
                <p className="eduvia-value-card__desc">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
