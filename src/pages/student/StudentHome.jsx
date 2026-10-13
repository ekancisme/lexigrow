import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import paymentService from '../../services/payment.service.js'
import './StudentHome.css'

const featuredTopics = [
  { id: 'environment', image: '/assets/editorial/home/environment.jpg', level: 'B2', titleKey: 'topicEnvironment', descriptionKey: 'topicEnvironmentDescription' },
  { id: 'technology', image: '/assets/editorial/home/technology.jpg', level: 'B1', titleKey: 'topicTechnology', descriptionKey: 'topicTechnologyDescription' },
  { id: 'daily-life', image: '/assets/editorial/topics/daily-life.webp', level: 'A2', titleKey: 'topicDailyLife', descriptionKey: 'topicDailyLifeDescription' },
  { id: 'hobbies', image: '/assets/editorial/topics/hobbies.webp', level: 'B1', titleKey: 'topicHobbies', descriptionKey: 'topicHobbiesDescription' },
]

const learningLinks = [
  { id: 'writing', icon: 'edit_note', image: '/assets/editorial/topics/auth-study.webp', href: '/student/writing', titleKey: 'writingTitle', descriptionKey: 'writingDesc', actionKey: 'writingAction' },
  { id: 'review', icon: 'style', image: '/assets/editorial/topics/daily-life.webp', href: '/student/vocabulary/review', titleKey: 'reviewTitle', descriptionKey: 'reviewDesc', actionKey: 'reviewAction' },
  { id: 'games', icon: 'extension', image: '/assets/editorial/topics/hobbies.webp', href: '/student/game', titleKey: 'gamesTitle', descriptionKey: 'gamesDescription', actionKey: 'gamesAction' },
]

const methodSteps = [
  { number: '01', icon: 'explore', titleKey: 'stepExploreTitle', bodyKey: 'stepExploreBody' },
  { number: '02', icon: 'quiz', titleKey: 'stepPracticeTitle', bodyKey: 'stepPracticeBody' },
  { number: '03', icon: 'edit_note', titleKey: 'stepWriteTitle', bodyKey: 'stepWriteBody' },
  { number: '04', icon: 'insights', titleKey: 'stepReviewTitle', bodyKey: 'stepReviewBody' },
]

export default function StudentHome() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [activeAnnouncement, setActiveAnnouncement] = useState(0)
  const [featuredPlan, setFeaturedPlan] = useState(null)

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

  useEffect(() => {
    let current = true
    paymentService.getPlans('student')
      .then(response => {
        const plans = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : [])
        const paidPlans = plans.filter(plan => Number(plan.monthlyPrice) > 0)
        const plan = paidPlans.find(item => item.tier === 'pro') || paidPlans[0]
        if (current) setFeaturedPlan(plan || null)
      })
      .catch(() => { if (current) setFeaturedPlan(null) })
    return () => { current = false }
  }, [])

  const visibleAnnouncements = user ? announcements : []
  const currentAnnouncementIndex = Math.min(activeAnnouncement, Math.max(visibleAnnouncements.length - 1, 0))
  const announcement = visibleAnnouncements[currentAnnouncementIndex]
  const announcementTitle = language === 'vi' ? announcement?.titleVi : announcement?.titleEn
  const announcementBody = language === 'vi' ? announcement?.bodyVi : announcement?.bodyEn
  const actionLabel = language === 'vi' ? announcement?.actionLabelVi : announcement?.actionLabelEn
  const imageAlt = language === 'vi' ? announcement?.imageAltVi : announcement?.imageAltEn

  const hasAnnouncementImage = Boolean(announcement?.bannerUrl || announcement?.imageUrl)

  return (
    <div className="student-home">
      {announcement && <section className={`student-home__announcement ${hasAnnouncementImage ? '' : 'student-home__announcement--no-image'}`} aria-labelledby="student-home-announcement-title">
        <div className="student-home__announcement-copy">
          <span className="student-home__eyebrow"><span aria-hidden="true" />{t('homePage.eventLabel')}</span>
          <h2 id="student-home-announcement-title">{announcementTitle}</h2>
          <p>{announcementBody}</p>
          {announcement.actionUrl && actionLabel && (
            /^https?:\/\//i.test(announcement.actionUrl)
              ? <a className="student-home__button student-home__button--primary" href={announcement.actionUrl} target="_blank" rel="noopener noreferrer">{actionLabel}<span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span></a>
              : <Link className="student-home__button student-home__button--primary" to={announcement.actionUrl}>{actionLabel}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link>
          )}
          {visibleAnnouncements.length > 1 && <div className="student-home__carousel-controls">
            <span aria-live="polite" aria-atomic="true">{t('homePage.slideCount', { current: currentAnnouncementIndex + 1, total: visibleAnnouncements.length })}</span>
            <button type="button" aria-label={t('homePage.previousEvent')} onClick={() => setActiveAnnouncement((currentAnnouncementIndex - 1 + visibleAnnouncements.length) % visibleAnnouncements.length)}>
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>
            <button type="button" aria-label={t('homePage.nextEvent')} onClick={() => setActiveAnnouncement((currentAnnouncementIndex + 1) % visibleAnnouncements.length)}>
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </button>
          </div>}
        </div>
        {(announcement.bannerUrl || announcement.imageUrl) && <img className="student-home__announcement-image" src={announcement.bannerUrl || announcement.imageUrl} alt={announcement.bannerUrl ? '' : (imageAlt || announcementTitle)} loading="lazy" decoding="async" />}
      </section>}

      <section className="student-home__intro" aria-labelledby="student-home-title">
        <div className="student-home__intro-copy">
          <p className="student-home__eyebrow">{t('homePage.eyebrow')}</p>
          <h1 id="student-home-title">{t('homePage.title')}</h1>
          <p className="student-home__lead">{t('homePage.intro')}</p>
          <div className="student-home__actions">
            <Link className="student-home__button student-home__button--primary" to="/student/explore">{t('homePage.exploreAction')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link>
            <Link className="student-home__text-link" to={user ? '/student/dashboard' : '/login'}>{user ? t('homePage.dashboardAction') : t('homePage.loginAction')}</Link>
          </div>
          <ul className="student-home__promise-list" aria-label={t('homePage.learningAreas')}>
            {[
              ['travel_explore', 'heroPointTopics'],
              ['edit_note', 'heroPointWriting'],
              ['update', 'heroPointReview'],
            ].map(([icon, key]) => <li key={key}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{t(`homePage.${key}`)}</li>)}
          </ul>
        </div>
        <figure className="student-home__hero-visual">
          <img className="student-home__intro-image" src="/assets/editorial/home/study-hero-v2.jpg" alt={language === 'vi' ? 'Sách tiếng Anh học thuật, vở ghi từ vựng và bài viết đang được luyện tập trên bàn học trong thư viện' : 'English academic books, a vocabulary notebook, and a writing exercise arranged on a study desk in a library'} width="1400" height="933" fetchPriority="high" />
          <div className="student-home__hero-badges" aria-label={t('homePage.learningAreas')}>
            {[
              ['travel_explore', 'heroPointTopics', 'blue'],
              ['edit_note', 'heroPointWriting', 'green'],
              ['update', 'heroPointReview', 'purple'],
            ].map(([icon, key, tone]) => <span className={`student-home__hero-badge student-home__hero-badge--${tone}`} key={key}>
              <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
              {t(`homePage.${key}`)}
            </span>)}
          </div>
          <figcaption><span className="material-symbols-outlined" aria-hidden="true">menu_book</span><span>{t('homePage.heroCaption')}</span></figcaption>
        </figure>
      </section>

      <section className="student-home__method-intro" aria-labelledby="student-home-method-intro-title">
        <div className="student-home__method-heading">
          <p className="student-home__eyebrow">{t('homePage.methodEyebrow')}</p>
          <h2 id="student-home-method-intro-title">{t('homePage.methodTitle')}</h2>
          <p>{t('homePage.methodIntro')}</p>
        </div>
        <div className="student-home__principles" aria-label={t('homePage.learningAreas')}>
          {[
            ['menu_book', 'topicsTitle', 'topicsDesc'],
            ['edit_note', 'writingTitle', 'writingDesc'],
            ['update', 'reviewTitle', 'reviewDesc'],
            ['extension', 'gamesTitle', 'gamesDescription'],
          ].map(([icon, titleKey, descriptionKey]) => <article className="student-home__principle" key={titleKey}>
            <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
            <div><h3>{t(`homePage.${titleKey}`)}</h3><p>{t(`homePage.${descriptionKey}`)}</p></div>
          </article>)}
        </div>
      </section>

      <section className="student-home__topics" aria-labelledby="student-home-topics-title">
        <div className="student-home__section-heading">
          <div><p className="student-home__eyebrow">{t('homePage.pathwaysEyebrow')}</p><h2 id="student-home-topics-title">{t('homePage.topicsSectionTitle')}</h2><p>{t('homePage.topicsSectionDescription')}</p></div>
          <Link className="student-home__section-link" to="/student/explore">{t('homePage.allTopics')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link>
        </div>
        <div className="student-home__topic-grid">
          {featuredTopics.map(topic => <Link className="student-home__topic-card" to="/student/explore" key={topic.id}>
            <div className="student-home__topic-image-wrap">
              <img className="student-home__topic-image" src={topic.image} alt="" loading="lazy" decoding="async" width="512" height="279" />
              <span className="student-home__level">{topic.level}</span>
            </div>
            <div className="student-home__topic-copy"><span className="student-home__topic-category">{t('homePage.topicCollection')}</span><h3>{t(`homePage.${topic.titleKey}`)}</h3><p>{t(`homePage.${topic.descriptionKey}`)}</p><span className="student-home__card-link">{t('homePage.openTopic')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></span></div>
          </Link>)}
        </div>
      </section>

      <section className="student-home__practice" aria-labelledby="student-home-practice-title">
        <div className="student-home__section-heading">
          <div><p className="student-home__eyebrow">{t('homePage.practiceEyebrow')}</p><h2 id="student-home-practice-title">{t('homePage.practiceTitle')}</h2><p>{t('homePage.practiceDescription')}</p></div>
          <Link className="student-home__section-link" to="/student/writing">{t('homePage.writingAction')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link>
        </div>
        <div className="student-home__learning-grid">
          {learningLinks.map(item => <Link className="student-home__learning-card" to={item.href} key={item.id}>
            <img className="student-home__learning-image" src={item.image} alt="" loading="lazy" decoding="async" width="800" height="450" />
            <div className="student-home__learning-copy"><span className="student-home__learning-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span><h3>{t(`homePage.${item.titleKey}`)}</h3><p>{t(`homePage.${item.descriptionKey}`)}</p><span className="student-home__card-link">{t(`homePage.${item.actionKey}`)}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></span></div>
          </Link>)}
        </div>
      </section>

      <section className="student-home__steps-section" aria-labelledby="student-home-steps-title">
        <div className="student-home__steps-intro"><p className="student-home__eyebrow">{t('homePage.methodEyebrow')}</p><h2 id="student-home-steps-title">{t('homePage.stepsTitle')}</h2><p>{t('homePage.stepsDescription')}</p><Link className="student-home__text-link" to="/student/explore">{t('homePage.methodAction')}<span aria-hidden="true">→</span></Link></div>
        <ol className="student-home__steps">
          {methodSteps.map(step => <li key={step.number}><span className="student-home__step-number">{step.number}</span><span className="material-symbols-outlined student-home__step-icon" aria-hidden="true">{step.icon}</span><div><h3>{t(`homePage.${step.titleKey}`)}</h3><p>{t(`homePage.${step.bodyKey}`)}</p></div></li>)}
        </ol>
      </section>

      {featuredPlan && <section className="student-home__pricing" aria-labelledby="student-home-pricing-title">
        <div className="student-home__section-heading">
          <div>
            <p className="student-home__eyebrow">{t('homePage.pricingEyebrow')}</p>
            <h2 id="student-home-pricing-title">{t('homePage.pricingTitle')}</h2>
            <p>{t('homePage.pricingDescription')}</p>
          </div>
          <Link className="student-home__section-link" to="/pricing">{t('homePage.pricingAllPlans')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link>
        </div>
        <article className="student-home__pricing-card">
          <div className="student-home__pricing-copy">
            <span className="student-home__pricing-label"><span className="material-symbols-outlined" aria-hidden="true">workspace_premium</span>{t('homePage.pricingFeatured')}</span>
            <h3>{featuredPlan.name}</h3>
            <p>{t('homePage.pricingPlanDescription')}</p>
            <div className="student-home__pricing-price">
              <strong>{new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(Number(featuredPlan.monthlyPrice))}</strong>
              <span>VND {t('pricing.perMonth')}</span>
            </div>
            <Link className="student-home__button student-home__button--primary" to="/pricing">{t('homePage.pricingAction')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link>
          </div>
          <div className="student-home__pricing-visual" aria-hidden="true">
            <div className="student-home__pricing-orbit">
              <span className="student-home__pricing-center material-symbols-outlined">workspace_premium</span>
              <span className="student-home__pricing-bubble student-home__pricing-bubble--ai"><span className="material-symbols-outlined">auto_awesome</span>{t('homePage.pricingBenefitAi')}</span>
              <span className="student-home__pricing-bubble student-home__pricing-bubble--review"><span className="material-symbols-outlined">update</span>{t('homePage.pricingBenefitReview')}</span>
              <span className="student-home__pricing-bubble student-home__pricing-bubble--growth"><span className="material-symbols-outlined">trending_up</span>{t('homePage.pricingBenefitGrowth')}</span>
            </div>
          </div>
        </article>
      </section>}

      <section className="student-home__closing" aria-labelledby="student-home-closing-title">
        <div><p className="student-home__eyebrow">{t('homePage.closingEyebrow')}</p><h2 id="student-home-closing-title">{t('homePage.closingTitle')}</h2><p>{t('homePage.closingDescription')}</p></div>
        <div className="student-home__actions"><Link className="student-home__button student-home__button--primary" to="/student/explore">{t('homePage.exploreAction')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link><Link className="student-home__button student-home__button--secondary" to={user ? '/student/dashboard' : '/login'}>{user ? t('homePage.dashboardAction') : t('homePage.loginAction')}</Link></div>
      </section>

    </div>
  )
}
