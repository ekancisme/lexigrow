import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import EditorialCoverImage from '../../components/common/EditorialCoverImage.jsx'
import api from '../../services/api.js'
import './StudentHome.css'

const pathways = [
  { id: 'topics', topicSlug: 'environment', icon: 'travel_explore', href: '/student/explore', titleKey: 'topicsTitle', descKey: 'topicsDesc', actionKey: 'topicsAction' },
  { id: 'writing', topicSlug: 'auth-study', icon: 'edit_note', href: '/student/writing', titleKey: 'writingTitle', descKey: 'writingDesc', actionKey: 'writingAction' },
  { id: 'review', topicSlug: 'daily-life', icon: 'style', href: '/student/vocabulary/review', titleKey: 'reviewTitle', descKey: 'reviewDesc', actionKey: 'reviewAction' },
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

  useEffect(() => {
    let current = true
    if (!user) return
    api.get('/announcements/active')
      .then(({ data }) => {
        if (current) setAnnouncements(Array.isArray(data?.data) ? data.data : [])
      })
      .catch(() => {
        if (current) setAnnouncements([])
      })
    return () => { current = false }
  }, [user])

  const currentAnnouncementIndex = Math.min(activeAnnouncement, Math.max(announcements.length - 1, 0))
  const announcement = announcements[currentAnnouncementIndex]
  const title = language === 'vi' ? announcement?.titleVi : announcement?.titleEn
  const body = language === 'vi' ? announcement?.bodyVi : announcement?.bodyEn
  const actionLabel = language === 'vi' ? announcement?.actionLabelVi : announcement?.actionLabelEn
  const imageAlt = language === 'vi' ? announcement?.imageAltVi : announcement?.imageAltEn

  return (
    <div className="student-home">
      <section className="student-home__intro" aria-labelledby="student-home-title">
        <div className="student-home__intro-copy">
          <p className="student-home__eyebrow">{t('homePage.eyebrow')}</p>
          <h1 id="student-home-title">{t('homePage.title')}</h1>
          <p className="student-home__lead">{t('homePage.intro')}</p>
          <div className="student-home__actions">
            <Link className="student-home__button student-home__button--primary" to="/student/explore">
              {t('homePage.exploreAction')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </Link>
            <Link className="student-home__text-link" to="/student/dashboard">{t('homePage.dashboardAction')}</Link>
          </div>
        </div>
        <EditorialCoverImage
          topicSlug="auth-study"
          className="student-home__intro-image"
          aspectRatio="5/4"
          priority
          fallbackTitle={t('homePage.imageFallback')}
          alt={language === 'vi'
            ? 'Không gian đọc và học tập yên tĩnh với sách'
            : 'A quiet reading and study space with books'}
        />
      </section>

      {announcement && <section className="student-home__events" aria-labelledby="student-home-events-title">
        <div className="student-home__section-heading student-home__events-heading">
          <div>
            <p className="student-home__eyebrow">{t('homePage.eventsEyebrow')}</p>
            <h2 id="student-home-events-title">{t('homePage.eventsTitle')}</h2>
          </div>
          {announcements.length > 1 && <div className="student-home__carousel-controls">
            <span aria-live="polite" aria-atomic="true">{t('homePage.slideCount', { current: currentAnnouncementIndex + 1, total: announcements.length })}</span>
            <button type="button" aria-label={t('homePage.previousEvent')} onClick={() => setActiveAnnouncement((currentAnnouncementIndex - 1 + announcements.length) % announcements.length)}>
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>
            <button type="button" aria-label={t('homePage.nextEvent')} onClick={() => setActiveAnnouncement((currentAnnouncementIndex + 1) % announcements.length)}>
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </button>
          </div>}
        </div>
        <article className="student-home__event" key={announcement._id}>
          <div className="student-home__event-copy">
            <span className="student-home__event-label"><span aria-hidden="true" />{t('homePage.eventLabel')}</span>
            <h3>{title}</h3>
            <p>{body}</p>
            {announcement.actionUrl && actionLabel && (
              announcement.actionUrl.startsWith('http://') || announcement.actionUrl.startsWith('https://') ? (
                <a className="student-home__event-link" href={announcement.actionUrl} target="_blank" rel="noopener noreferrer">
                  {actionLabel}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </a>
              ) : (
                <Link className="student-home__event-link" to={announcement.actionUrl}>
                  {actionLabel}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </Link>
              )
            )}
          </div>
          {(announcement.bannerUrl || announcement.imageUrl) && <img
            className="student-home__event-image"
            src={announcement.bannerUrl || announcement.imageUrl}
            alt={announcement.bannerUrl ? '' : (imageAlt || title)}
            loading="lazy"
            decoding="async"
          />}
        </article>
      </section>}

      <section className="student-home__pathways" aria-labelledby="student-home-pathways-title">
        <div className="student-home__section-heading">
          <div>
            <p className="student-home__eyebrow">{t('homePage.pathwaysEyebrow')}</p>
            <h2 id="student-home-pathways-title">{t('homePage.pathwaysTitle')}</h2>
            <p>{t('homePage.pathwaysIntro')}</p>
          </div>
          <Link className="student-home__section-link" to="/student/explore">{t('homePage.allTopics')}<span aria-hidden="true">→</span></Link>
        </div>
        <div className="student-home__pathway-list">
          {pathways.map(pathway => <Link className="student-home__pathway" to={pathway.href} key={pathway.id}>
            <EditorialCoverImage topicSlug={pathway.topicSlug} className="student-home__pathway-image" aspectRatio="16/10" fallbackIcon={pathway.icon} fallbackTitle={t(`homePage.${pathway.titleKey}`)} />
            <div className="student-home__pathway-copy">
              <span className="student-home__pathway-icon material-symbols-outlined" aria-hidden="true">{pathway.icon}</span>
              <h3>{t(`homePage.${pathway.titleKey}`)}</h3>
              <p>{t(`homePage.${pathway.descKey}`)}</p>
              <span className="student-home__pathway-action">{t(`homePage.${pathway.actionKey}`)}<span aria-hidden="true">→</span></span>
            </div>
          </Link>)}
        </div>
      </section>

      <section className="student-home__method" aria-labelledby="student-home-method-title">
        <div className="student-home__method-intro">
          <p className="student-home__eyebrow">{t('homePage.methodEyebrow')}</p>
          <h2 id="student-home-method-title">{t('homePage.methodTitle')}</h2>
          <p>{t('homePage.methodIntro')}</p>
          <Link className="student-home__text-link" to="/student/explore">{t('homePage.methodAction')}<span aria-hidden="true"> →</span></Link>
        </div>
        <ol className="student-home__steps">
          {methodSteps.map(step => <li key={step.number}>
            <span className="student-home__step-number">{step.number}</span>
            <span className="material-symbols-outlined student-home__step-icon" aria-hidden="true">{step.icon}</span>
            <div><h3>{t(`homePage.${step.titleKey}`)}</h3><p>{t(`homePage.${step.bodyKey}`)}</p></div>
          </li>)}
        </ol>
      </section>

      <footer className="student-home__footer">
        <Link to="/student/home" className="student-home__footer-brand">
          <img src="/assets/brand/lexigrow-emblem.png" alt="" width="22" height="22" className="student-home__footer-logo" />
          <span>LexiGrow</span>
        </Link>
        <p>{t('homePage.footerCopy')}</p>
        <Link to="/settings">{t('homePage.helpLink')}</Link>
      </footer>
    </div>
  )
}
