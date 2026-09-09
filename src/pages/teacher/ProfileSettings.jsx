import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useModal } from '../../contexts/ModalContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './ProfileSettings.css'

const INTEREST_MAP = {
  'travel': { labelVi: 'Du lịch & Khám phá', labelEn: 'Travel & Exploration', icon: 'flight_takeoff' },
  'daily-life': { labelVi: 'Đời sống & Giao tiếp', labelEn: 'Daily Life & Routines', icon: 'coffee' },
  'technology': { labelVi: 'Công nghệ & Đổi mới', labelEn: 'Technology & Innovation', icon: 'memory' },
  'career': { labelVi: 'Công việc & Sự nghiệp', labelEn: 'Work & Career Growth', icon: 'work' },
  'academic': { labelVi: 'Học thuật & Viết luận IELTS', labelEn: 'Academic & IELTS Writing', icon: 'menu_book' },
  'hobbies': { labelVi: 'Sở thích & Nghệ thuật', labelEn: 'Hobbies & Creative Arts', icon: 'palette' },
  'science': { labelVi: 'Khoa học & Tự nhiên', labelEn: 'Science & Nature', icon: 'psychology' },
  'food': { labelVi: 'Ẩm thực & Dinh dưỡng', labelEn: 'Culinary & Healthy Living', icon: 'restaurant' },
  'business': { labelVi: 'Kinh doanh & Tài chính', labelEn: 'Business & Finance', icon: 'trending_up' },
  'society': { labelVi: 'Xã hội & Tin tức', labelEn: 'Global News & Society', icon: 'public' }
}

export default function ProfileSettings() {
  const navigate = useNavigate()
  const { user: authUser, updateUser } = useAuth()
  const { showAlert, showConfirm } = useModal()
  const { t, language } = useLanguage()
  const isVi = language === 'vi'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [englishLevel, setEnglishLevel] = useState('B2')
  const [learningProfile, setLearningProfile] = useState(null)
  const [notifications, setNotifications] = useState({ email: true, push: true, weekly: false })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [linkCode, setLinkCode] = useState(null)
  const [generatingLinkCode, setGeneratingLinkCode] = useState(false)
  const [linkCodeSecondsLeft, setLinkCodeSecondsLeft] = useState(0)
  const [linkCodeCopied, setLinkCodeCopied] = useState(false)
  const [guardians, setGuardians] = useState([])
  const [guardiansLoading, setGuardiansLoading] = useState(false)
  const [guardiansError, setGuardiansError] = useState('')
  const [removingGuardianId, setRemovingGuardianId] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/profile')
        const user = res.data
        setName(user.name || '')
        setEmail(user.email || '')
        setInstitution(user.institution || '')
        setEnglishLevel(user.englishLevel || 'B2')
        setLearningProfile(user.learningProfile || authUser?.learningProfile || null)
        if (user.notifications) {
          setNotifications({
            email: user.notifications.email ?? true,
            push: user.notifications.push ?? true,
            weekly: user.notifications.weekly ?? false,
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [authUser?.learningProfile])

  useEffect(() => {
    if (authUser?.role === 'student') {
      loadGuardians()
    }
  }, [authUser?._id, authUser?.role])

  useEffect(() => {
    if (!linkCode?.expiresAt) return undefined

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((new Date(linkCode.expiresAt).getTime() - Date.now()) / 1000))
      setLinkCodeSecondsLeft(secondsLeft)
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(timer)
  }, [linkCode])

  async function loadGuardians() {
    setGuardiansLoading(true)
    setGuardiansError('')
    try {
      const response = await api.get('/parent/guardians')
      setGuardians(response.data || [])
    } catch (err) {
      setGuardiansError(err.message || 'Could not load linked guardians.')
    } finally {
      setGuardiansLoading(false)
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const res = await api.put('/profile', {
        name,
        email,
        institution,
        englishLevel,
      })
      if (updateUser) {
        updateUser(res.data)
      }
      showAlert(t('profileSettings.profileSaved', 'Profile updated successfully!'), '', 'success')
    } catch (err) {
      showAlert(t('profileSettings.profileSaveError', 'Error updating profile:'), err.message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleToggleNotification(key) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    setSavingNotifs(true)
    try {
      await api.put('/profile/notifications', updated)
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    } finally {
      setSavingNotifs(false)
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      showAlert('Vui lòng nhập đầy đủ mật khẩu', 'Please fill out both password fields.', 'warning')
      return
    }
    setUpdatingPassword(true)
    try {
      await api.put('/profile/password', {
        currentPassword,
        newPassword,
      })
      showAlert(t('profileSettings.passwordUpdated', 'Password updated successfully!'), '', 'success')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      showAlert('Lỗi đổi mật khẩu', err.message, 'error')
    } finally {
      setUpdatingPassword(false)
    }
  }

  async function handleGenerateLinkCode() {
    setGeneratingLinkCode(true)
    setLinkCodeCopied(false)
    try {
      const response = await api.post('/parent/link-code')
      if (!response.data?.code || !response.data?.expiresAt) {
        throw new Error('The server returned an invalid link code.')
      }
      setLinkCode(response.data)
    } catch (err) {
      showAlert('Could not generate code', err.message, 'error')
    } finally {
      setGeneratingLinkCode(false)
    }
  }

  async function handleCopyLinkCode() {
    try {
      await navigator.clipboard.writeText(linkCode.code)
      setLinkCodeCopied(true)
      window.setTimeout(() => setLinkCodeCopied(false), 2000)
    } catch {
      showAlert('Could not copy code', 'Please select and copy the code manually.', 'error')
    }
  }

  function handleRemoveGuardian(guardian) {
    showConfirm(
      t('profileSettings.removeGuardianTitle', 'Remove guardian access?'),
      `${guardian.parent.name} ${t('profileSettings.removeGuardianDesc', 'will no longer be able to view your learning progress.')}`,
      async () => {
        setRemovingGuardianId(guardian.linkId)
        try {
          await api.delete(`/parent/guardians/${guardian.linkId}`)
          setGuardians(current => current.filter(item => item.linkId !== guardian.linkId))
          showAlert('Access removed', `${guardian.parent.name} no longer has access to your learning progress.`, 'success')
        } catch (err) {
          showAlert('Could not remove access', err.message, 'error')
        } finally {
          setRemovingGuardianId(null)
        }
      }
    )
  }

  function formatRelationship(relationship) {
    return relationship ? relationship.charAt(0).toUpperCase() + relationship.slice(1) : 'Guardian'
  }

  function formatCountdown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="profile-settings-loading-screen">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  // Active learning profile data
  const lp = learningProfile || authUser?.learningProfile || {
    targetLevel: englishLevel || 'B1',
    dailyGoalMinutes: 10,
    pace: 'steady',
    interests: ['daily-life', 'technology']
  }

  const selectedInterestsList = (lp?.interests || ['daily-life']).map(id => ({
    id,
    ...(INTEREST_MAP[id] || { labelVi: id, labelEn: id, icon: 'label' })
  }))

  return (
    <div className="profile-settings-page animate-fade-in">
      {/* Page Header */}
      <header className="profile-settings__header">
        <div className="profile-settings__title-group">
          <div className="profile-settings__header-icon">
            <span className="material-symbols-outlined">manage_accounts</span>
          </div>
          <div>
            <h1 className="profile-settings__title">{t('profileSettings.title', 'Profile & Roadmap Settings')}</h1>
            <p className="profile-settings__subtitle">
              {t('profileSettings.subtitle', 'Manage your account details, AI learning roadmap, and system preferences')}
            </p>
          </div>
        </div>
      </header>

      <div className="profile-settings__layout">
        {/* SECTION 1: AI Learning Roadmap (Highlighted for Students & Learners) */}
        {(authUser?.role === 'student' || lp?.onboardingCompleted || lp?.targetLevel) && (
          <section className="settings-card settings-card--roadmap">
            <div className="roadmap-card-header">
              <div className="roadmap-card-header__left">
                <div className="roadmap-header-badge">
                  <span className="pulsing-dot"></span>
                  <span>{t('profileSettings.srsEngine', 'AI Spaced Repetition Engine')} • {t('profileSettings.active', 'Active')}</span>
                </div>
                <h2 className="roadmap-title">{t('profileSettings.roadmapCardTitle', 'Personalized AI Learning Roadmap')}</h2>
                <p className="roadmap-desc">
                  {t('profileSettings.roadmapCardDesc', 'Your learning goals and pace are configured so AI can schedule SRS vocabulary and calibrate essay scoring.')}
                </p>
              </div>

              <div className="roadmap-card-header__right">
                <button
                  type="button"
                  className="btn-edit-roadmap"
                  onClick={() => navigate('/student/onboarding')}
                >
                  <span className="material-symbols-outlined">tune</span>
                  <span>{t('profileSettings.editRoadmap', 'Edit Roadmap')}</span>
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="roadmap-metrics-grid">
              <div className="roadmap-metric-item">
                <span className="material-symbols-outlined metric-icon">school</span>
                <div>
                  <span className="metric-label">{t('profileSettings.targetGoal', 'Target Goal')}</span>
                  <strong className="metric-val">{lp.targetLevel || 'B1'} CEFR</strong>
                </div>
              </div>

              <div className="roadmap-metric-item">
                <span className="material-symbols-outlined metric-icon">speed</span>
                <div>
                  <span className="metric-label">{t('profileSettings.learningPace', 'Learning Pace')}</span>
                  <strong className="metric-val">
                    {lp.pace === 'intensive' ? (isVi ? 'Cấp tốc (30 ngày)' : 'Intensive (30 Days)') : (isVi ? 'Bền vững (60-90 ngày)' : 'Steady (60-90 Days)')}
                  </strong>
                </div>
              </div>

              <div className="roadmap-metric-item">
                <span className="material-symbols-outlined metric-icon">schedule</span>
                <div>
                  <span className="metric-label">{t('profileSettings.dailyCommitment', 'Daily Study Time')}</span>
                  <strong className="metric-val">{lp.dailyGoalMinutes || 10} {isVi ? 'phút / ngày' : 'mins / day'}</strong>
                </div>
              </div>
            </div>

            {/* Topics Selected Chips */}
            <div className="roadmap-topics-section">
              <span className="topics-heading">{t('profileSettings.focusTopics', 'Focus Topics')}:</span>
              <div className="topics-chips-row">
                {selectedInterestsList.map(item => (
                  <span key={item.id} className="topic-chip-badge">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{isVi ? item.labelVi : item.labelEn}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Parents & Guardians (For Students) */}
        {authUser?.role === 'student' && (
          <section className="settings-card profile-settings__guardians">
            <div className="profile-settings__guardians-header">
              <div>
                <h3 className="settings-card-title">{t('profileSettings.parentsCardTitle', 'Parents & Guardians')}</h3>
                <p className="settings-card-desc">
                  {t('profileSettings.parentsCardDesc', 'Manage parent accounts authorized to monitor your learning progress and essays.')}
                </p>
              </div>
              <button
                type="button"
                className="btn btn--outline btn--sm profile-settings__add-guardian-btn"
                onClick={handleGenerateLinkCode}
                disabled={generatingLinkCode}
              >
                <span className="material-symbols-outlined">person_add</span>
                <span>{generatingLinkCode ? t('profileSettings.generating', 'Generating...') : linkCode ? t('profileSettings.newCode', 'New code') : t('profileSettings.addGuardian', 'Add guardian')}</span>
              </button>
            </div>

            {linkCode ? (
              <div className={`profile-settings__link-code-panel ${linkCodeSecondsLeft === 0 ? 'profile-settings__link-code-panel--expired' : ''}`} role="status">
                <div>
                  <p className="text-label-md">{t('profileSettings.oneTimeCode', 'One-time guardian link code')}</p>
                  <strong aria-label={`Parent link code ${linkCode.code}`}>{linkCode.code}</strong>
                  <p className="text-label-sm">
                    {linkCodeSecondsLeft > 0 ? `${t('profileSettings.codeExpiresIn', 'Expires in')} ${formatCountdown(linkCodeSecondsLeft)}` : t('profileSettings.codeExpired', 'Code expired')}
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-settings__copy-code-btn"
                  onClick={handleCopyLinkCode}
                  disabled={linkCodeSecondsLeft === 0}
                >
                  <span className="material-symbols-outlined">
                    {linkCodeCopied ? 'check' : 'content_copy'}
                  </span>
                  <span>{linkCodeCopied ? t('profileSettings.copied', 'Copied') : t('profileSettings.copy', 'Copy')}</span>
                </button>
              </div>
            ) : null}

            {linkCode ? (
              <p className="text-label-sm profile-settings__link-code-note">
                {t('profileSettings.shareCodeNote', 'Share this code directly with your parent or guardian to link accounts.')}
              </p>
            ) : null}

            <div className="profile-settings__guardian-list" aria-live="polite">
              {guardiansLoading ? (
                <div className="profile-settings__guardians-loading">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Loading linked guardians...</span>
                </div>
              ) : guardiansError ? (
                <div className="profile-settings__guardians-error">
                  <span>{guardiansError}</span>
                  <button type="button" onClick={loadGuardians}>Retry</button>
                </div>
              ) : guardians.length === 0 ? (
                <div className="profile-settings__guardians-empty">
                  <span className="material-symbols-outlined">family_restroom</span>
                  <div>
                    <p className="text-label-md">{t('profileSettings.noGuardians', 'No guardians linked yet')}</p>
                    <p className="text-body-sm">{t('profileSettings.noGuardiansDesc', 'Generate a one-time code to invite a parent or guardian.')}</p>
                  </div>
                </div>
              ) : (
                guardians.map(guardian => (
                  <div className="profile-settings__guardian-row" key={guardian.linkId}>
                    <div className="profile-settings__guardian-avatar">
                      {guardian.parent.avatar ? (
                        <img src={guardian.parent.avatar} alt="" />
                      ) : (
                        <span className="material-symbols-outlined">person</span>
                      )}
                    </div>
                    <div className="profile-settings__guardian-identity">
                      <p className="guardian-name">{guardian.parent.name}</p>
                      <p className="guardian-email">{guardian.parent.email}</p>
                    </div>
                    <div className="profile-settings__guardian-meta">
                      <span>{formatRelationship(guardian.relationship)}</span>
                      <span>{new Date(guardian.linkedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <button
                      type="button"
                      className="profile-settings__remove-guardian-btn"
                      onClick={() => handleRemoveGuardian(guardian)}
                      disabled={removingGuardianId === guardian.linkId}
                    >
                      <span className="material-symbols-outlined">person_remove</span>
                      <span>{removingGuardianId === guardian.linkId ? 'Removing...' : t('profileSettings.removeGuardian', 'Remove')}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* SECTION 3: Personal Information */}
        <section className="settings-card">
          <div className="settings-card-header-simple">
            <span className="material-symbols-outlined card-header-icon">badge</span>
            <h3 className="settings-card-title">{t('profileSettings.personalInfo', 'Personal Information')}</h3>
          </div>

          <div className="profile-settings__avatar-section">
            <div className="profile-settings__avatar-wrap">
              <div className="profile-settings__avatar">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="profile-settings__avatar-info">
                <strong className="avatar-user-name">{name || 'User'}</strong>
                <span className="avatar-user-role">{authUser?.role?.toUpperCase() || 'STUDENT'}</span>
              </div>
            </div>
          </div>

          <div className="profile-settings__form-grid">
            <div className="profile-settings__field">
              <label className="text-label-md">{t('profileSettings.fullName', 'Full Name')}</label>
              <input
                type="text"
                className="profile-settings__input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nguyen Van A"
              />
            </div>
            <div className="profile-settings__field">
              <label className="text-label-md">{t('profileSettings.email', 'Email Address')}</label>
              <input
                type="email"
                className="profile-settings__input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@domain.com"
              />
            </div>
            <div className="profile-settings__field">
              <label className="text-label-md">{t('profileSettings.institution', 'Institution / School')}</label>
              <input
                type="text"
                className="profile-settings__input"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="LexiGrow University"
              />
            </div>
            <div className="profile-settings__field">
              <label className="text-label-md">{t('profileSettings.englishLevel', 'Current English Level')}</label>
              <select
                className="profile-settings__input"
                value={englishLevel}
                onChange={e => setEnglishLevel(e.target.value)}
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficient</option>
              </select>
            </div>
          </div>

          <div className="profile-settings__actions-bar">
            <button
              type="button"
              className="btn btn--primary profile-settings__save-btn"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>{t('profileSettings.saving', 'Saving...')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>{t('profileSettings.saveProfile', 'Save Changes')}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECTION 4: Notifications Preferences */}
        <section className="settings-card">
          <div className="settings-card-header-simple">
            <span className="material-symbols-outlined card-header-icon">notifications</span>
            <h3 className="settings-card-title">{t('profileSettings.notificationsTitle', 'Notification Preferences')} {savingNotifs && '(saving...)'}</h3>
          </div>

          <div className="notification-toggles-list">
            {[
              { key: 'email', label: t('profileSettings.emailNotifs', 'Email Notifications'), desc: t('profileSettings.emailNotifsDesc', 'Receive email alerts for learning reminders and classroom activity'), icon: 'mail' },
              { key: 'push', label: t('profileSettings.pushNotifs', 'Browser Notifications'), desc: t('profileSettings.pushNotifsDesc', 'Get instant push notifications on your device'), icon: 'campaign' },
              { key: 'weekly', label: t('profileSettings.weeklyNotifs', 'Weekly Digest'), desc: t('profileSettings.weeklyNotifsDesc', 'Receive a weekly summary email with progress and new words'), icon: 'calendar_month' },
            ].map(item => (
              <div key={item.key} className="profile-settings__toggle-row">
                <div className="toggle-row__info">
                  <span className="material-symbols-outlined toggle-info-icon">{item.icon}</span>
                  <div>
                    <p className="toggle-label">{item.label}</p>
                    <p className="toggle-desc">{item.desc}</p>
                  </div>
                </div>
                <label className="profile-settings__toggle">
                  <input
                    type="checkbox"
                    checked={notifications[item.key] || false}
                    onChange={() => handleToggleNotification(item.key)}
                  />
                  <span className="profile-settings__toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: Security & Password */}
        <section className="settings-card">
          <div className="settings-card-header-simple">
            <span className="material-symbols-outlined card-header-icon">lock</span>
            <h3 className="settings-card-title">{t('profileSettings.securityTitle', 'Security & Password')}</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="security-password-form">
            <div className="profile-settings__form-grid">
              <div className="profile-settings__field">
                <label className="text-label-md">{t('profileSettings.currentPassword', 'Current Password')}</label>
                <input
                  type="password"
                  className="profile-settings__input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="profile-settings__field">
                <label className="text-label-md">{t('profileSettings.newPassword', 'New Password')}</label>
                <input
                  type="password"
                  className="profile-settings__input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="profile-settings__actions-bar">
              <button
                type="submit"
                className="btn btn--outline profile-settings__save-btn"
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">key</span>
                    <span>{t('profileSettings.updatePassword', 'Update Password')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

