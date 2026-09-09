import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import './Onboarding.css'

const INTEREST_OPTIONS = [
  { id: 'travel', label: 'Travel & Exploration', labelVi: 'Du lịch & Khám phá', icon: 'flight_takeoff', descVi: 'Khách sạn, sân bay, trải nghiệm & văn hóa quốc tế', descEn: 'Hotels, flights, culture & global experiences' },
  { id: 'daily-life', label: 'Daily Life & Routines', labelVi: 'Đời sống & Giao tiếp', icon: 'coffee', descVi: 'Sinh hoạt thường ngày, bạn bè, gia đình & thói quen', descEn: 'Routines, friends, family & everyday conversations' },
  { id: 'technology', label: 'Technology & Innovation', labelVi: 'Công nghệ & Đổi mới', icon: 'memory', descVi: 'AI, phần mềm, thiết bị số & kỷ nguyên công nghệ', descEn: 'AI, software, digital devices & modern tech' },
  { id: 'career', label: 'Work & Career Growth', labelVi: 'Công việc & Sự nghiệp', icon: 'work', descVi: 'Giao tiếp công sở, đàm phán, quản lý & phỏng vấn', descEn: 'Office communication, negotiation & interviews' },
  { id: 'academic', label: 'Academic & IELTS Writing', labelVi: 'Học thuật & Viết luận IELTS', icon: 'menu_book', descVi: 'Từ vựng học thuật, viết essay & luận điểm tranh biện', descEn: 'Academic vocabulary, essay writing & arguments' },
  { id: 'hobbies', label: 'Hobbies & Creative Arts', labelVi: 'Sở thích & Nghệ thuật', icon: 'palette', descVi: 'Âm nhạc, điện ảnh, nhiếp ảnh & sáng tạo nghệ thuật', descEn: 'Music, cinema, photography & creative arts' },
  { id: 'science', label: 'Science & Nature', labelVi: 'Khoa học & Tự nhiên', icon: 'psychology', descVi: 'Vũ trụ, môi trường sinh thái, vật lý & công nghệ sinh học', descEn: 'Space, ecology, physics & biotechnology' },
  { id: 'food', label: 'Culinary & Healthy Living', labelVi: 'Ẩm thực & Dinh dưỡng', icon: 'restaurant', descVi: 'Món ăn, nấu nướng, dinh dưỡng & lối sống lành mạnh', descEn: 'Food culture, cooking, nutrition & healthy habits' },
  { id: 'business', label: 'Business & Finance', labelVi: 'Kinh doanh & Tài chính', icon: 'trending_up', descVi: 'Tài chính cá nhân, khởi nghiệp, đầu tư & kinh tế', descEn: 'Personal finance, startups, investment & economics' },
  { id: 'society', label: 'Global News & Society', labelVi: 'Xã hội & Tin tức toàn cầu', icon: 'public', descVi: 'Thời sự quốc tế, xã hội đương đại & xu hướng toàn cầu', descEn: 'World affairs, current trends & global issues' }
]

const LEVEL_OPTIONS = [
  {
    id: 'A2',
    label: 'Elementary (A2)',
    labelVi: 'Sơ cấp (A2)',
    tag: 'Foundation',
    words: '500+ từ cốt lõi',
    wordsEn: '500+ core words',
    descVi: 'Nắm chắc ngữ pháp cơ bản, tự tin xây dựng câu đơn và giao tiếp hàng ngày',
    descEn: 'Build solid basics, construct simple sentences and daily interactions',
    srsVi: 'Chu kỳ lặp SRS 1-3-7 ngày',
    srsEn: '1-3-7 day SRS Spaced Repetition'
  },
  {
    id: 'B1',
    label: 'Intermediate (B1)',
    labelVi: 'Trung cấp (B1)',
    tag: 'Popular',
    words: '1,200+ từ vựng',
    wordsEn: '1,200+ words',
    descVi: 'Giao tiếp tự nhiên, diễn đạt trôi chảy và viết các đoạn văn/nhật ký ngắn',
    descEn: 'Communicate naturally, express thoughts smoothly & write short essays',
    srsVi: 'Chu kỳ thích ứng theo độ nhớ',
    srsEn: 'Adaptive recall-based SRS'
  },
  {
    id: 'B2',
    label: 'Upper Intermediate (B2)',
    labelVi: 'Trung cao cấp (B2)',
    tag: 'Academic',
    words: '2,500+ từ vựng',
    wordsEn: '2,500+ words',
    descVi: 'Viết bài luận học thuật IELTS 6.0 - 6.5+, phản xạ collocations và tranh biện đa chiều',
    descEn: 'IELTS 6.0 - 6.5+ academic essays, fluent collocations & structured debates',
    srsVi: 'Tối ưu hóa Spaced Repetition nâng cao',
    srsEn: 'Advanced Spaced Repetition optimization'
  },
  {
    id: 'C1',
    label: 'Advanced (C1)',
    labelVi: 'Cao cấp (C1)',
    tag: 'Mastery',
    words: '5,000+ từ nâng cao',
    wordsEn: '5,000+ advanced words',
    descVi: 'Văn phong bản ngữ tinh tế IELTS 7.5+, idioms chuyên sâu và lập luận học thuật sắc bén',
    descEn: 'Native-like nuance IELTS 7.5+, rich idioms & sharp academic discourse',
    srsVi: 'Thử thách ngữ cảnh chuyên sâu',
    srsEn: 'Deep contextual challenge mode'
  }
]

const PACE_OPTIONS = [
  {
    id: 'steady',
    titleVi: 'Bền vững & Chắc chắn (60 - 90 ngày)',
    titleEn: 'Steady & Sustainable (60 - 90 Days)',
    badgeVi: 'Khuyên dùng',
    badgeEn: 'Recommended',
    wordsPerDayVi: '5 - 10 từ mới / ngày',
    wordsPerDayEn: '5 - 10 new words / day',
    descVi: 'Xây dựng thói quen kiên trì mỗi ngày, ghi nhớ sâu qua Spaced Repetition và cân bằng luyện viết luận.',
    descEn: 'Builds lasting daily habits, reinforces deep retention via SRS and balances essay practice.',
    icon: 'eco'
  },
  {
    id: 'intensive',
    titleVi: 'Cấp tốc & Bứt phá (30 ngày)',
    titleEn: 'Intensive Track (30 Days)',
    badgeVi: 'Tập trung cao',
    badgeEn: 'High Focus',
    wordsPerDayVi: '15 - 20 từ mới / ngày',
    wordsPerDayEn: '15 - 20 new words / day',
    descVi: 'Tần suất ôn tập SRS dày đặc, bứt phá vốn từ vựng trong thời gian ngắn để chuẩn bị thi cử.',
    descEn: 'High-frequency SRS reviews, rapidly expands active vocabulary for upcoming exams.',
    icon: 'bolt'
  }
]

const TIME_OPTIONS = [
  { minutes: 5, labelVi: '5 phút / ngày', labelEn: '5 mins / day', subVi: 'Nhẹ nhàng', subEn: 'Casual', icon: 'bolt' },
  { minutes: 10, labelVi: '10 phút / ngày', labelEn: '10 mins / day', subVi: 'Khuyên dùng • Chuẩn SRS', subEn: 'Recommended • SRS', popular: true, icon: 'auto_awesome' },
  { minutes: 15, labelVi: '15 phút / ngày', labelEn: '15 mins / day', subVi: 'Chuyên sâu • Luyện viết AI', subEn: 'Intensive • AI Writing', icon: 'edit_note' },
  { minutes: 20, labelVi: '20 phút / ngày', labelEn: '20 mins / day', subVi: 'Tăng tốc • Bứt phá', subEn: 'Fast Track • Rapid', icon: 'rocket_launch' }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const isVi = language === 'vi'

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState(user?.learningProfile?.targetLevel || 'B1')
  const [selectedInterests, setSelectedInterests] = useState(
    user?.learningProfile?.interests?.length ? user.learningProfile.interests : ['daily-life', 'technology', 'career']
  )
  const [selectedPace, setSelectedPace] = useState(user?.learningProfile?.pace || 'steady')
  const [selectedMinutes, setSelectedMinutes] = useState(user?.learningProfile?.dailyGoalMinutes || 10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id)
        ? (prev.length > 1 ? prev.filter(item => item !== id) : prev)
        : [...prev, id]
    )
  }

  const selectAllInterests = () => {
    setSelectedInterests(INTEREST_OPTIONS.map(i => i.id))
  }

  const clearInterests = () => {
    setSelectedInterests(['daily-life'])
  }

  // Estimated vocabulary projection in 30 days
  const dailyWordsEst = selectedPace === 'intensive'
    ? 18
    : (selectedMinutes >= 20 ? 15 : (selectedMinutes >= 15 ? 12 : (selectedMinutes >= 10 ? 8 : 5)))
  const est30Days = dailyWordsEst * 30

  const handleComplete = async () => {
    setIsSubmitting(true)
    const payload = {
      interests: selectedInterests,
      targetLevel: selectedLevel,
      dailyGoalMinutes: selectedMinutes,
      pace: selectedPace,
      onboardingCompleted: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
    }

    try {
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
          learningProfile: payload
        })
      }
    } finally {
      setIsSubmitting(false)
      navigate('/student/dashboard')
    }
  }

  const steps = [
    { num: 1, label: t('onboarding.step1', 'CEFR Goal'), icon: 'school' },
    { num: 2, label: t('onboarding.step2', 'Interests'), icon: 'interests' },
    { num: 3, label: t('onboarding.step3', 'Pace & Time'), icon: 'timer' },
    { num: 4, label: t('onboarding.step4', 'AI Roadmap'), icon: 'psychology' }
  ]

  return (
    <div className="onboarding-page-wrapper">
      {/* Top Transactional Header */}
      <header className="onboarding-top-nav">
        <div className="onboarding-top-nav__brand">
          <div className="onboarding-brand-icon">
            <span className="material-symbols-outlined">psychology</span>
          </div>
          <div className="onboarding-brand-text">
            <span className="brand-name">LexiGrow<span className="brand-ai">AI</span></span>
          </div>
          <div className="onboarding-ai-pill">
            <span className="pulsing-dot"></span>
            <span>{t('onboarding.badge', 'AI Personalized Roadmap Setup')}</span>
          </div>
        </div>

        <div className="onboarding-top-nav__actions">
          {/* Language Switcher */}
          <button
            type="button"
            className="onboarding-lang-btn"
            onClick={() => setLanguage(isVi ? 'en' : 'vi')}
            title="Switch Language"
          >
            <span className="material-symbols-outlined lang-icon">translate</span>
            <span className="lang-text">{isVi ? 'VI 🇻🇳' : 'EN 🇬🇧'}</span>
          </button>

          {/* Skip Link */}
          <button
            type="button"
            className="onboarding-skip-btn"
            onClick={() => navigate('/student/dashboard')}
          >
            <span>{t('onboarding.skip', 'Skip for now')}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="onboarding-main-container">
        {/* Step Indicator Bar */}
        <div className="onboarding-stepper-card">
          <div className="stepper-progress-track">
            <div
              className="stepper-progress-fill"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
          <div className="stepper-steps">
            {steps.map(s => {
              const isCompleted = currentStep > s.num
              const isActive = currentStep === s.num
              return (
                <button
                  key={s.num}
                  type="button"
                  className={`stepper-item ${isActive ? 'stepper-item--active' : ''} ${isCompleted ? 'stepper-item--completed' : ''}`}
                  onClick={() => setCurrentStep(s.num)}
                >
                  <div className="stepper-item__circle">
                    {isCompleted ? (
                      <span className="material-symbols-outlined">check</span>
                    ) : (
                      <span>{s.num}</span>
                    )}
                  </div>
                  <span className="stepper-item__label">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="onboarding-content-card animate-fade-in" key={currentStep}>
          {/* Step 1: CEFR Level */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="step-header">
                <span className="step-badge">
                  <span className="material-symbols-outlined">school</span>
                  <span>{t('onboarding.step1', 'CEFR Goal')}</span>
                </span>
                <h1 className="step-title">{t('onboarding.step1Title', 'Target English Proficiency (CEFR)')}</h1>
                <p className="step-description">
                  {t('onboarding.step1Desc', 'Select your target level so AI adjusts vocabulary depth and lesson complexity.')}
                </p>
              </div>

              <div className="level-grid-enhanced">
                {LEVEL_OPTIONS.map(lvl => {
                  const isSelected = selectedLevel === lvl.id
                  return (
                    <div
                      key={lvl.id}
                      className={`level-card-item ${isSelected ? 'level-card-item--selected' : ''}`}
                      onClick={() => setSelectedLevel(lvl.id)}
                    >
                      <div className="level-card-top">
                        <div className="level-card-tag-wrap">
                          <span className="level-cefr-badge">{lvl.id}</span>
                          <span className="level-sub-tag">{lvl.tag}</span>
                        </div>
                        <div className={`level-radio ${isSelected ? 'level-radio--checked' : ''}`}>
                          {isSelected && <span className="material-symbols-outlined">check</span>}
                        </div>
                      </div>

                      <h3 className="level-card-heading">{isVi ? lvl.labelVi : lvl.label}</h3>
                      <div className="level-card-words">
                        <span className="material-symbols-outlined">library_books</span>
                        <span>{isVi ? lvl.words : lvl.wordsEn}</span>
                      </div>
                      <p className="level-card-text">{isVi ? lvl.descVi : lvl.desc}</p>
                      
                      <div className="level-card-srs">
                        <span className="material-symbols-outlined">sync</span>
                        <span>{isVi ? lvl.srsVi : lvl.srsEn}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Topics / Interests */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="step-header">
                <div className="step-header__row">
                  <div>
                    <span className="step-badge">
                      <span className="material-symbols-outlined">interests</span>
                      <span>{t('onboarding.step2', 'Interests')}</span>
                    </span>
                    <h1 className="step-title">{t('onboarding.step2Title', 'What topics interest you most?')}</h1>
                    <p className="step-description">
                      {t('onboarding.step2Desc', 'Select at least 1 topic. AI will prioritize vocabulary and quests in these domains.')}
                    </p>
                  </div>
                  <div className="topic-quick-actions">
                    <button type="button" className="btn-chip" onClick={selectAllInterests}>
                      {t('onboarding.step2SelectAll', 'Select all')}
                    </button>
                    <button type="button" className="btn-chip" onClick={clearInterests}>
                      {t('onboarding.step2Clear', 'Clear all')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="topic-grid-enhanced">
                {INTEREST_OPTIONS.map(item => {
                  const isSelected = selectedInterests.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`topic-card ${isSelected ? 'topic-card--selected' : ''}`}
                      onClick={() => toggleInterest(item.id)}
                    >
                      <div className="topic-card__icon-box">
                        <span className="material-symbols-outlined">{item.icon}</span>
                      </div>
                      <div className="topic-card__content">
                        <div className="topic-card__title-row">
                          <h4 className="topic-card__title">{isVi ? item.labelVi : item.label}</h4>
                          <span className={`topic-checkbox ${isSelected ? 'topic-checkbox--active' : ''}`}>
                            {isSelected && <span className="material-symbols-outlined">check</span>}
                          </span>
                        </div>
                        <p className="topic-card__desc">{isVi ? item.descVi : item.descEn}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Pace & Daily Time */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="step-header">
                <span className="step-badge">
                  <span className="material-symbols-outlined">timer</span>
                  <span>{t('onboarding.step3', 'Pace & Time')}</span>
                </span>
                <h1 className="step-title">{t('onboarding.step3Title', 'Learning Pace & Daily Time Commitment')}</h1>
                <p className="step-description">
                  {t('onboarding.step3Desc', 'Choose the pace and daily duration that best fits your lifestyle.')}
                </p>
              </div>

              {/* Part 1: Pace Options */}
              <div className="pace-selection-block">
                <h3 className="section-subtitle">
                  <span className="material-symbols-outlined">speed</span>
                  <span>{t('onboarding.paceTitle', 'Learning Pace')}</span>
                </h3>
                <div className="pace-grid">
                  {PACE_OPTIONS.map(pace => {
                    const isSelected = selectedPace === pace.id
                    return (
                      <div
                        key={pace.id}
                        className={`pace-card ${isSelected ? 'pace-card--selected' : ''}`}
                        onClick={() => setSelectedPace(pace.id)}
                      >
                        <div className="pace-card__header">
                          <div className="pace-card__icon">
                            <span className="material-symbols-outlined">{pace.icon}</span>
                          </div>
                          <span className="pace-badge">{isVi ? pace.badgeVi : pace.badgeEn}</span>
                        </div>
                        <h4 className="pace-card__title">{isVi ? pace.titleVi : pace.titleEn}</h4>
                        <div className="pace-words-pill">
                          <span className="material-symbols-outlined">auto_stories</span>
                          <span>{isVi ? pace.wordsPerDayVi : pace.wordsPerDayEn}</span>
                        </div>
                        <p className="pace-card__desc">{isVi ? pace.descVi : pace.descEn}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Part 2: Daily Time Options */}
              <div className="time-selection-block">
                <h3 className="section-subtitle">
                  <span className="material-symbols-outlined">schedule</span>
                  <span>{t('onboarding.timeTitle', 'Daily Study Time')}</span>
                </h3>
                <div className="time-grid-enhanced">
                  {TIME_OPTIONS.map(time => {
                    const isSelected = selectedMinutes === time.minutes
                    return (
                      <div
                        key={time.minutes}
                        className={`time-card-item ${isSelected ? 'time-card-item--selected' : ''} ${time.popular ? 'time-card-item--popular' : ''}`}
                        onClick={() => setSelectedMinutes(time.minutes)}
                      >
                        {time.popular && (
                          <span className="time-popular-tag">
                            {isVi ? 'Phổ biến nhất' : 'Most Popular'}
                          </span>
                        )}
                        <div className="time-icon-wrap">
                          <span className="material-symbols-outlined">{time.icon}</span>
                        </div>
                        <h4 className="time-card-title">{isVi ? time.labelVi : time.labelEn}</h4>
                        <p className="time-card-sub">{isVi ? time.subVi : time.subEn}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: AI Roadmap Preview & Final Activation */}
          {currentStep === 4 && (
            <div className="step-content">
              <div className="step-header">
                <span className="step-badge step-badge--ai">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span>{t('onboarding.step4', 'AI Roadmap')}</span>
                </span>
                <h1 className="step-title">{t('onboarding.step4Title', 'Your AI-Driven Learning Roadmap')}</h1>
                <p className="step-description">
                  {t('onboarding.step4Desc', 'Here is your personalized learning blueprint customized by AI.')}
                </p>
              </div>

              {/* Strategy Highlights Box */}
              <div className="ai-roadmap-hero-card">
                <div className="ai-roadmap-hero__header">
                  <div className="ai-status-indicator">
                    <span className="pulsing-emerald"></span>
                    <span className="status-label">{t('onboarding.aiEngineActive', 'AI Spaced Repetition Engine Activated')}</span>
                  </div>
                  <div className="ai-vocab-projection">
                    <span className="projection-label">{t('onboarding.estimatedVocab30Days', 'Est. Vocabulary in 30 Days')}</span>
                    <span className="projection-value">+{est30Days} {t('onboarding.words', 'words')}</span>
                  </div>
                </div>

                <div className="ai-roadmap-metrics-grid">
                  <div className="metric-box">
                    <span className="metric-icon material-symbols-outlined">school</span>
                    <div className="metric-content">
                      <span className="metric-label">{t('onboarding.targetGoal', 'Target Goal')}</span>
                      <span className="metric-val">{selectedLevel} Level</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <span className="metric-icon material-symbols-outlined">speed</span>
                    <div className="metric-content">
                      <span className="metric-label">{t('onboarding.learningPace', 'Learning Pace')}</span>
                      <span className="metric-val">{selectedPace === 'intensive' ? (isVi ? 'Cấp tốc' : 'Intensive') : (isVi ? 'Bền vững' : 'Steady')}</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <span className="metric-icon material-symbols-outlined">schedule</span>
                    <div className="metric-content">
                      <span className="metric-label">{t('onboarding.dailyCommitment', 'Daily Study Time')}</span>
                      <span className="metric-val">{selectedMinutes} {isVi ? 'phút / ngày' : 'mins / day'}</span>
                    </div>
                  </div>
                  <div className="metric-box">
                    <span className="metric-icon material-symbols-outlined">interests</span>
                    <div className="metric-content">
                      <span className="metric-label">{t('onboarding.topicsSelected', 'Selected Topics')}</span>
                      <span className="metric-val">{selectedInterests.length} {isVi ? 'chủ đề' : 'topics'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Phase Roadmap Timeline */}
              <div className="roadmap-timeline-section">
                <h3 className="timeline-title">
                  <span className="material-symbols-outlined">timeline</span>
                  <span>{t('onboarding.aiRoadmapOverview', 'Personalized Roadmap Summary')}</span>
                </h3>

                <div className="roadmap-phases-grid">
                  <div className="phase-card phase-card--1">
                    <div className="phase-card__header">
                      <span className="phase-number">01</span>
                      <h4 className="phase-title">{t('onboarding.phase1Title', 'Phase 1: Foundations & Recall (Weeks 1-2)')}</h4>
                    </div>
                    <p className="phase-desc">{t('onboarding.phase1Desc', 'Kickstart core topic vocabulary and activate the SRS long-term memory engine.')}</p>
                    <div className="phase-tag">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Daily Quest + Flashcards</span>
                    </div>
                  </div>

                  <div className="phase-card phase-card--2">
                    <div className="phase-card__header">
                      <span className="phase-number">02</span>
                      <h4 className="phase-title">{t('onboarding.phase2Title', 'Phase 2: Expansion & Paragraphs (Weeks 3-6)')}</h4>
                    </div>
                    <p className="phase-desc">{t('onboarding.phase2Desc', 'Learn advanced collocations and practice short paragraph writing with instant AI feedback.')}</p>
                    <div className="phase-tag">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Collocations + AI Feedback</span>
                    </div>
                  </div>

                  <div className="phase-card phase-card--3">
                    <div className="phase-card__header">
                      <span className="phase-number">03</span>
                      <h4 className="phase-title">{t('onboarding.phase3Title', 'Phase 3: Mastery & Essays (Weeks 7+)')}</h4>
                    </div>
                    <p className="phase-desc">{t('onboarding.phase3Desc', 'Fluently apply rich vocabulary in comprehensive essays with confident academic tone.')}</p>
                    <div className="phase-tag">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Full Essay + CEFR Scoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Bar */}
          <footer className="onboarding-action-footer">
            <div className="footer-left">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn--outline btn--back"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  <span>{t('onboarding.back', 'Back')}</span>
                </button>
              )}
            </div>

            <div className="footer-right">
              {currentStep < 4 ? (
                <button
                  type="button"
                  className="btn btn--primary btn--next btn--lg"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                >
                  <span>{t('onboarding.next', 'Next Step')}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--submit btn--lg"
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
                      <span>{t('onboarding.startSession', 'Save Roadmap & Start Learning')}</span>
                      <span className="material-symbols-outlined">rocket_launch</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}


