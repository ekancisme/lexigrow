import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import './Onboarding.css'

const INTEREST_OPTIONS = [
  { id: 'travel', label: 'Travel & Exploration', labelVi: 'Du lịch & Khám phá', icon: 'flight_takeoff' },
  { id: 'daily-life', label: 'Daily Life & Routines', labelVi: 'Đời sống & Sinh hoạt hàng ngày', icon: 'coffee' },
  { id: 'technology', label: 'Technology & Innovation', labelVi: 'Công nghệ & Đổi mới sáng tạo', icon: 'memory' },
  { id: 'career', label: 'Work & Career', labelVi: 'Công việc & Phát triển sự nghiệp', icon: 'work' },
  { id: 'hobbies', label: 'Hobbies & Creativity', labelVi: 'Sở thích & Nghệ thuật sáng tạo', icon: 'palette' },
  { id: 'food', label: 'Food & Culture', labelVi: 'Ẩm thực & Văn hóa', icon: 'restaurant' },
  { id: 'science', label: 'Science & Nature', labelVi: 'Khoa học & Tự nhiên', icon: 'psychology' },
  { id: 'academic', label: 'Academic & Essay Writing', labelVi: 'Học thuật & Viết luận IELTS', icon: 'menu_book' }
]

const LEVEL_OPTIONS = [
  { id: 'A2', label: 'Elementary (A2)', labelVi: 'Sơ cấp (A2)', desc: 'Knows basic words, wants to build fuller sentences', descVi: 'Nắm từ vựng cơ bản, muốn mở rộng câu hoàn chỉnh' },
  { id: 'B1', label: 'Intermediate (B1)', labelVi: 'Trung cấp (B1)', desc: 'Confident in basic talks, wants natural phrasing', descVi: 'Tự tin giao tiếp cơ bản, muốn diễn đạt tự nhiên hơn' },
  { id: 'B2', label: 'Upper Intermediate (B2)', labelVi: 'Trung cao cấp (B2)', desc: 'Academic writing, advanced and nuanced vocabulary', descVi: 'Viết học thuật, từ vựng chuyên sâu và đa dạng' },
  { id: 'C1', label: 'Advanced (C1)', labelVi: 'Cao cấp (C1)', desc: 'Professional fluency, sophisticated idioms & stylistic writing', descVi: 'Thành thạo chuyên nghiệp, dùng thành ngữ và lối viết tinh tế' }
]

const TIME_OPTIONS = [
  { minutes: 5, label: '5 mins / day', labelVi: '5 phút / ngày', sub: 'Casual', subVi: 'Nhẹ nhàng' },
  { minutes: 10, label: '10 mins / day', labelVi: '10 phút / ngày', sub: 'Recommended', subVi: 'Khuyên dùng', popular: true },
  { minutes: 15, label: '15 mins / day', labelVi: '15 phút / ngày', sub: 'Intensive', subVi: 'Chuyên sâu' },
  { minutes: 20, label: '20 mins / day', labelVi: '20 phút / ngày', sub: 'Fast Track', subVi: 'Tăng tốc' }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { t, language } = useLanguage()
  const [selectedInterests, setSelectedInterests] = useState(
    user?.learningProfile?.interests?.length ? user.learningProfile.interests : ['daily-life', 'technology']
  )
  const [selectedLevel, setSelectedLevel] = useState(user?.learningProfile?.targetLevel || 'B1')
  const [selectedMinutes, setSelectedMinutes] = useState(user?.learningProfile?.dailyGoalMinutes || 10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isVi = language === 'vi'

  const toggleInterest = (id) => {
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(item => item !== id) : prev)
        : [...prev, id]
    )
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        interests: selectedInterests,
        targetLevel: selectedLevel,
        dailyGoalMinutes: selectedMinutes,
        onboardingCompleted: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
      }

      const res = await api.put('/profile/learning', payload)
      if (updateUser) {
        updateUser({
          learningProfile: res.data?.data || payload
        })
      }
    } catch (err) {
      console.warn('Could not save profile to server, continuing with local state', err)
      if (updateUser) {
        updateUser({
          learningProfile: {
            interests: selectedInterests,
            targetLevel: selectedLevel,
            dailyGoalMinutes: selectedMinutes,
            onboardingCompleted: true
          }
        })
      }
    } finally {
      setIsSubmitting(false)
      navigate('/student/dashboard')
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container card-base animate-fade-in">
        {/* Header */}
        <header className="onboarding-header">
          <div className="onboarding-badge">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>{t('onboarding.badge', 'Personalized Experience')}</span>
          </div>
          <h1 className="text-headline-lg">{t('onboarding.title', 'Welcome to LexiGrow!')}</h1>
          <p className="text-body-lg onboarding-desc">
            {t('onboarding.desc', 'Quick 1-minute setup so AI can recommend vocabulary sessions tailored to your goals.')}
          </p>
        </header>

        {/* Section 1: Interests */}
        <section className="onboarding-section">
          <h2 className="onboarding-section__title">
            <span className="step-num">1</span>
            {t('onboarding.step1Title', 'What topics interest you most?')}
            <span className="step-hint">{t('onboarding.step1Hint', '(Select at least 1 topic)')}</span>
          </h2>
          <div className="interest-grid">
            {INTEREST_OPTIONS.map(item => {
              const isSelected = selectedInterests.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`interest-chip ${isSelected ? 'interest-chip--selected' : ''}`}
                  onClick={() => toggleInterest(item.id)}
                >
                  <span className="material-symbols-outlined interest-chip__icon">{item.icon}</span>
                  <span className="interest-chip__label">{isVi ? item.labelVi : item.label}</span>
                  {isSelected && <span className="material-symbols-outlined check-icon">check</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Section 2: Level */}
        <section className="onboarding-section">
          <h2 className="onboarding-section__title">
            <span className="step-num">2</span>
            {t('onboarding.step2Title', 'Target English Proficiency')}
          </h2>
          <div className="level-grid">
            {LEVEL_OPTIONS.map(lvl => {
              const isSelected = selectedLevel === lvl.id
              return (
                <div
                  key={lvl.id}
                  className={`level-card ${isSelected ? 'level-card--selected' : ''}`}
                  onClick={() => setSelectedLevel(lvl.id)}
                >
                  <div className="level-card__header">
                    <span className="level-tag">{lvl.id}</span>
                    {isSelected && <span className="material-symbols-outlined check-badge">check_circle</span>}
                  </div>
                  <h3 className="level-card__title">{isVi ? lvl.labelVi : lvl.label}</h3>
                  <p className="level-card__desc">{isVi ? lvl.descVi : lvl.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 3: Time Goal */}
        <section className="onboarding-section">
          <h2 className="onboarding-section__title">
            <span className="step-num">3</span>
            {t('onboarding.step3Title', 'Daily Learning Time Commitment')}
          </h2>
          <div className="time-grid">
            {TIME_OPTIONS.map(time => {
              const isSelected = selectedMinutes === time.minutes
              return (
                <div
                  key={time.minutes}
                  className={`time-card ${isSelected ? 'time-card--selected' : ''} ${time.popular ? 'time-card--popular' : ''}`}
                  onClick={() => setSelectedMinutes(time.minutes)}
                >
                  {time.popular && <span className="popular-badge">{isVi ? 'Khuyên dùng' : 'Recommended'}</span>}
                  <span className="material-symbols-outlined time-icon">schedule</span>
                  <h3 className="time-card__title">{isVi ? time.labelVi : time.label}</h3>
                  <p className="time-card__sub">{isVi ? time.subVi : time.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 4: Live AI Learning Plan Preview */}
        <section className="onboarding-section onboarding-ai-preview">
          <div className="onboarding-ai-card">
            <div className="onboarding-ai-header">
              <span className="material-symbols-outlined onboarding-ai-icon">psychology</span>
              <div>
                <h3 className="onboarding-ai-title">{t('onboarding.aiPlanTitle', 'Personalized AI Strategy')}</h3>
                <p className="onboarding-ai-subtitle">
                  {t('onboarding.aiPlanDesc', 'AI will automatically track your progress, suggest relevant daily quest words, and customize writing feedback according to this plan.')}
                </p>
              </div>
            </div>
            <div className="onboarding-ai-stats">
              <div className="onboarding-ai-stat">
                <span className="stat-label">{t('onboarding.targetGoal', 'Target Goal')}</span>
                <span className="stat-value">{selectedLevel} Level</span>
              </div>
              <div className="onboarding-ai-stat">
                <span className="stat-label">{t('onboarding.dailyCommitment', 'Daily Study')}</span>
                <span className="stat-value">{selectedMinutes} {isVi ? 'phút / ngày' : 'mins / day'}</span>
              </div>
              <div className="onboarding-ai-stat">
                <span className="stat-label">{t('onboarding.topicsSelected', 'Selected Topics')}</span>
                <span className="stat-value">{selectedInterests.length} {isVi ? 'chủ đề' : 'topics'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="onboarding-actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navigate('/student/dashboard')}
          >
            {t('onboarding.skip', 'Skip for now')}
          </button>
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={handleComplete}
            disabled={isSubmitting || selectedInterests.length === 0}
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>{t('onboarding.saving', 'Saving Profile...')}</span>
              </>
            ) : (
              <>
                <span>{t('onboarding.startSession', 'Save & Start First Session')}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

