import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import './Onboarding.css'

const INTEREST_OPTIONS = [
  { id: 'travel', label: 'Travel & Exploration', icon: 'flight_takeoff' },
  { id: 'daily-life', label: 'Daily Life & Routines', icon: 'coffee' },
  { id: 'technology', label: 'Technology & Innovation', icon: 'memory' },
  { id: 'career', label: 'Work & Career', icon: 'work' },
  { id: 'hobbies', label: 'Hobbies & Creativity', icon: 'palette' },
  { id: 'food', label: 'Food & Culture', icon: 'restaurant' },
  { id: 'science', label: 'Science & Nature', icon: 'psychology' },
  { id: 'academic', label: 'Academic & Essay Writing', icon: 'menu_book' }
]

const LEVEL_OPTIONS = [
  { id: 'A2', label: 'Elementary (A2)', desc: 'Knows basic words, wants to build fuller sentences' },
  { id: 'B1', label: 'Intermediate (B1)', desc: 'Confident in basic talks, wants natural phrasing' },
  { id: 'B2', label: 'Upper Intermediate (B2)', desc: 'Academic writing, advanced and nuanced vocabulary' }
]

const TIME_OPTIONS = [
  { minutes: 5, label: '5 mins / day', sub: 'Casual' },
  { minutes: 10, label: '10 mins / day', sub: 'Recommended', popular: true },
  { minutes: 15, label: '15 mins / day', sub: 'Intensive' }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedInterests, setSelectedInterests] = useState(['travel', 'daily-life'])
  const [selectedLevel, setSelectedLevel] = useState('B1')
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await api.put('/profile/learning', {
        interests: selectedInterests,
        targetLevel: selectedLevel,
        dailyGoalMinutes: selectedMinutes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
      }).catch(() => {
        // Fallback to local storage if backend profile endpoint is pending
        localStorage.setItem('lexigrow_learning_profile', JSON.stringify({
          interests: selectedInterests,
          targetLevel: selectedLevel,
          dailyGoalMinutes: selectedMinutes
        }))
      })
    } catch (err) {
      console.warn('Could not save profile to server, continuing with local state', err)
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
            <span>Personalized Experience</span>
          </div>
          <h1 className="text-headline-lg">Welcome to LexiGrow!</h1>
          <p className="text-body-lg onboarding-desc">
            Quick 1-minute setup so AI can recommend vocabulary sessions tailored to your goals.
          </p>
        </header>

        {/* Section 1: Interests */}
        <section className="onboarding-section">
          <h2 className="onboarding-section__title">
            <span className="step-num">1</span>
            What topics interest you most?
            <span className="step-hint">(Select at least 1 topic)</span>
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
                  <span className="interest-chip__label">{item.label}</span>
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
            Self-assessed English Proficiency
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
                  <h3 className="level-card__title">{lvl.label}</h3>
                  <p className="level-card__desc">{lvl.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 3: Time Goal */}
        <section className="onboarding-section">
          <h2 className="onboarding-section__title">
            <span className="step-num">3</span>
            Daily Learning Goal
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
                  {time.popular && <span className="popular-badge">Recommended</span>}
                  <span className="material-symbols-outlined time-icon">schedule</span>
                  <h3 className="time-card__title">{time.label}</h3>
                  <p className="time-card__sub">{time.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="onboarding-actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navigate('/student/dashboard')}
          >
            Skip for now
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
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Start First Session</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
