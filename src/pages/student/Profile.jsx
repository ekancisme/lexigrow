import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useModal } from '../../contexts/ModalContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import Button from '../../components/common/Button'
import './Profile.css'

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

export default function Profile() {
  const navigate = useNavigate()
  const { user: authUser, updateUser } = useAuth()
  const { showAlert, showConfirm } = useModal()
  const { t, language } = useLanguage()
  const isVi = language === 'vi'

  // Tab state matching Figma Frame 625:14214
  // Options: 'profile' | 'personalisation' | 'account' | 'payment' | 'notifications' | 'privacy'
  const [activeTab, setActiveTab] = useState('profile')

  // Form Fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [headline, setHeadline] = useState('')
  const [profileLink, setProfileLink] = useState('www.lexigrow.io')
  const [institution, setInstitution] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [englishLevel, setEnglishLevel] = useState('B2')
  const [avatar, setAvatar] = useState('/assets/editorial/user-avatar.png')
  const [learningProfile, setLearningProfile] = useState(null)

  // Loading & Action states
  const avatarInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Guardians link state
  const [linkCode, setLinkCode] = useState(null)
  const [generatingLinkCode, setGeneratingLinkCode] = useState(false)
  const [linkCodeSecondsLeft, setLinkCodeSecondsLeft] = useState(0)
  const [linkCodeCopied, setLinkCodeCopied] = useState(false)
  const [guardians, setGuardians] = useState([])
  const [guardiansLoading, setGuardiansLoading] = useState(false)
  const [guardiansError, setGuardiansError] = useState('')
  const [removingGuardianId, setRemovingGuardianId] = useState(null)

  // Notification toggles
  const [notifDailyStreak, setNotifDailyStreak] = useState(true)
  const [notifAiEvaluation, setNotifAiEvaluation] = useState(true)
  const [notifNewsletter, setNotifNewsletter] = useState(false)

  // Privacy toggles
  const [privacyPublicProfile, setPrivacyPublicProfile] = useState(true)
  const [privacyShowRank, setPrivacyShowRank] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/profile')
        const user = res?.data?.data || res?.data || res
        
        // Split name into first and last name if possible
        const fullName = user.name || authUser?.name || 'Jonathan Doe'
        const parts = fullName.trim().split(' ')
        if (parts.length > 1) {
          setFirstName(parts.slice(0, -1).join(' '))
          setLastName(parts[parts.length - 1])
        } else {
          setFirstName(fullName)
          setLastName('')
        }

        setEmail(user.email || authUser?.email || '')
        setHeadline(user.headline || 'IELTS Aspirant & Dedicated LexiGrow Learner')
        setProfileLink(user.website || 'www.lexigrow.io')
        setInstitution(user.institution || 'LexiGrow Academy')
        setEnglishLevel(user.englishLevel || 'B2')
        if (user.avatar) setAvatar(user.avatar)
        setLearningProfile(user.learningProfile || authUser?.learningProfile || null)
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [authUser])

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

  async function handleSaveProfile(e) {
    if (e) e.preventDefault()
    setSavingProfile(true)
    setSaveSuccess(false)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const res = await api.put('/profile', {
        name: fullName,
        email,
        institution,
        englishLevel,
        avatar,
        headline,
        website: profileLink,
      })
      if (updateUser) {
        updateUser(res?.data?.data || res?.data || res)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      showAlert(t('profileSettings.profileSaved', 'Profile updated successfully!'), '', 'success')
    } catch (err) {
      showAlert(t('profileSettings.profileSaveError', 'Error updating profile:'), err.message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      showAlert(
        isVi ? 'Ảnh không hợp lệ' : 'Invalid image',
        isVi ? 'Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 2 MB.' : 'Choose a JPG, PNG or WebP image up to 2 MB.',
        'warning'
      )
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatar(String(reader.result || ''))
    reader.readAsDataURL(file)
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
          setGuardians((current) => current.filter((item) => item.linkId !== guardian.linkId))
          showAlert('Access removed', `${guardian.parent.name} no longer has access.`, 'success')
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
      <div className="figma-account-loading">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 44, color: '#3DCBB1' }}>
          progress_activity
        </span>
      </div>
    )
  }

  // Active learning profile data
  const lp = learningProfile || authUser?.learningProfile || {
    targetLevel: englishLevel || 'B2',
    dailyGoalMinutes: 10,
    pace: 'steady',
    interests: ['daily-life', 'technology', 'academic']
  }

  const selectedInterestsList = (lp?.interests || ['daily-life', 'academic']).map((id) => ({
    id,
    ...(INTEREST_MAP[id] || { labelVi: id, labelEn: id, icon: 'label' })
  }))

  return (
    <div className="figma-account-page animate-fade-in">
      {/* ── 1. CENTERED PAGE TITLE (Figma Frame 625:14214) ── */}
      <h1 className="figma-account-title">{isVi ? 'Tài Khoản Của Tôi' : 'My Account'}</h1>

      {/* ── 2. CENTERED TAB NAVIGATION ── */}
      <nav className="figma-account-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          className={`figma-account-tab ${activeTab === 'profile' ? 'figma-account-tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {isVi ? 'Hồ sơ' : 'Profile'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'personalisation'}
          className={`figma-account-tab ${activeTab === 'personalisation' ? 'figma-account-tab--active' : ''}`}
          onClick={() => setActiveTab('personalisation')}
        >
          {isVi ? 'Cá nhân hoá' : 'Personalisation'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'account'}
          className={`figma-account-tab ${activeTab === 'account' ? 'figma-account-tab--active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          {isVi ? 'Tài khoản & Bảo mật' : 'Account'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'payment'}
          className={`figma-account-tab ${activeTab === 'payment' ? 'figma-account-tab--active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          {isVi ? 'Phương thức thanh toán' : 'Payment Methods'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'notifications'}
          className={`figma-account-tab ${activeTab === 'notifications' ? 'figma-account-tab--active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          {isVi ? 'Thông báo' : 'Notifications'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'privacy'}
          className={`figma-account-tab ${activeTab === 'privacy' ? 'figma-account-tab--active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          {isVi ? 'Quyền riêng tư' : 'Privacy'}
        </button>
      </nav>

      {/* ── 3. TAB 1: PROFILE (Direct Figma Frame 625:14214 Layout) ── */}
      {activeTab === 'profile' && (
        <div className="figma-account-body animate-fade-in">
          {/* Centered Avatar with Camera Badge */}
          <div className="figma-avatar-center-wrap">
            <div className="figma-avatar-container">
              <img
                src={avatar || '/assets/editorial/user-avatar.png'}
                alt="Profile Avatar"
                className="figma-avatar-circle"
              />
              <button
                type="button"
                className="figma-avatar-camera-btn"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Upload new photo"
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="figma-avatar-file-input"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Minimal Underline Form Grid */}
          <form className="figma-profile-form" onSubmit={handleSaveProfile}>
            <div className="figma-form-field">
              <label htmlFor="first-name" className="figma-field-label">
                {isVi ? 'Tên' : 'First Name'}
              </label>
              <input
                id="first-name"
                type="text"
                className="figma-underline-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jonathan"
                required
              />
            </div>

            <div className="figma-form-field">
              <label htmlFor="last-name" className="figma-field-label">
                {isVi ? 'Họ' : 'Last Name'}
              </label>
              <input
                id="last-name"
                type="text"
                className="figma-underline-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>

            <div className="figma-form-field">
              <label htmlFor="headline" className="figma-field-label">
                {isVi ? 'Dòng giới thiệu' : 'Headline'}
              </label>
              <input
                id="headline"
                type="text"
                className="figma-underline-input"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="IELTS Aspirant & Senior Learner"
              />
            </div>

            <div className="figma-form-field">
              <label htmlFor="language-select" className="figma-field-label">
                {isVi ? 'Ngôn ngữ' : 'Language'}
              </label>
              <div className="figma-select-wrap">
                <select
                  id="language-select"
                  className="figma-underline-input figma-select-input"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Vietnamese">Tiếng Việt</option>
                  <option value="French">Français</option>
                  <option value="Japanese">日本語</option>
                </select>
                <span className="material-symbols-outlined figma-select-chevron">expand_more</span>
              </div>
            </div>

            <div className="figma-form-field">
              <label htmlFor="profile-link" className="figma-field-label">
                {isVi ? 'Liên kết website / mạng xã hội' : 'Link'}
              </label>
              <input
                id="profile-link"
                type="text"
                className="figma-underline-input"
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                placeholder="www.lexigrow.io"
              />
            </div>

            <div className="figma-form-field">
              <label htmlFor="profile-institution" className="figma-field-label">
                {isVi ? 'Trường học / Tổ chức' : 'Institution / School'}
              </label>
              <input
                id="profile-institution"
                type="text"
                className="figma-underline-input"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="LexiGrow Academy"
              />
            </div>

            <div className="figma-form-field">
              <label htmlFor="english-level" className="figma-field-label">
                {isVi ? 'Trình độ CEFR mục tiêu' : 'Target CEFR Level'}
              </label>
              <div className="figma-select-wrap">
                <select
                  id="english-level"
                  className="figma-underline-input figma-select-input"
                  value={englishLevel}
                  onChange={(e) => setEnglishLevel(e.target.value)}
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced (IELTS 7.0 - 8.0)</option>
                  <option value="C2">C2 - Proficient (IELTS 8.5+)</option>
                </select>
                <span className="material-symbols-outlined figma-select-chevron">expand_more</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="figma-form-action-center">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="figma-save-btn"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>{isVi ? 'Đang lưu…' : 'Saving…'}</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <span className="material-symbols-outlined">check</span>
                    <span>{isVi ? 'Đã lưu!' : 'Saved!'}</span>
                  </>
                ) : (
                  <span>{isVi ? 'Lưu thay đổi' : 'Save'}</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── 4. TAB 2: PERSONALISATION (Learning Roadmap & Preferences) ── */}
      {activeTab === 'personalisation' && (
        <div className="figma-account-body figma-tab-container animate-fade-in">
          <div className="figma-section-box">
            <div className="figma-box-header">
              <div>
                <div className="figma-badge-pill">
                  <span className="pulsing-teal-dot" />
                  <span>{isVi ? 'Động cơ AI ngắt quãng (SRS) • Đang hoạt động' : 'AI Spaced Repetition Engine • Active'}</span>
                </div>
                <h3 className="figma-box-title">
                  {isVi ? 'Lộ Trình Cá Nhân Hoá' : 'Personalized AI Learning Roadmap'}
                </h3>
                <p className="figma-box-desc">
                  {isVi
                    ? 'AI tự động sắp xếp bộ từ vựng ngắt quãng và chấm bài viết dựa trên lộ trình của bạn.'
                    : 'Your goals and pace are configured so AI can schedule SRS vocabulary and calibrate essay feedback.'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="figma-pill-btn"
                leftIcon="tune"
                onClick={() => navigate('/student/onboarding')}
              >
                {isVi ? 'Chỉnh sửa lộ trình' : 'Edit Roadmap'}
              </Button>
            </div>

            {/* Roadmap metrics grid */}
            <div className="figma-roadmap-metrics">
              <div className="figma-metric-card">
                <span className="material-symbols-outlined figma-metric-icon">school</span>
                <div>
                  <div className="figma-metric-label">{isVi ? 'Mục tiêu' : 'Target Goal'}</div>
                  <strong className="figma-metric-value">{lp.targetLevel || 'B2'} CEFR</strong>
                </div>
              </div>

              <div className="figma-metric-card">
                <span className="material-symbols-outlined figma-metric-icon">speed</span>
                <div>
                  <div className="figma-metric-label">{isVi ? 'Tốc độ học' : 'Pace'}</div>
                  <strong className="figma-metric-value">
                    {lp.pace === 'intensive'
                      ? (isVi ? 'Cấp tốc (30 ngày)' : 'Intensive (30 Days)')
                      : (isVi ? 'Bền vững (60-90 ngày)' : 'Steady (60-90 Days)')}
                  </strong>
                </div>
              </div>

              <div className="figma-metric-card">
                <span className="material-symbols-outlined figma-metric-icon">schedule</span>
                <div>
                  <div className="figma-metric-label">{isVi ? 'Thời gian mỗi ngày' : 'Daily Time'}</div>
                  <strong className="figma-metric-value">
                    {lp.dailyGoalMinutes || 10} {isVi ? 'phút / ngày' : 'mins / day'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Topic chips */}
            <div className="figma-topics-area">
              <div className="figma-topics-label">{isVi ? 'Chủ đề trọng tâm' : 'Focus Topics'}:</div>
              <div className="figma-topics-wrap">
                {selectedInterestsList.map((item) => (
                  <span key={item.id} className="figma-topic-pill">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{isVi ? item.labelVi : item.labelEn}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TAB 3: ACCOUNT & GUARDIANS ── */}
      {activeTab === 'account' && (
        <div className="figma-account-body figma-tab-container animate-fade-in">
          {/* Email & Credentials */}
          <div className="figma-section-box">
            <h3 className="figma-box-title">{isVi ? 'Thông tin đăng nhập' : 'Login Credentials'}</h3>
            <div className="figma-form-field" style={{ marginTop: 16 }}>
              <label className="figma-field-label">Email</label>
              <input
                type="email"
                className="figma-underline-input"
                value={email}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>
          </div>

          {/* Linked Guardians (for students) */}
          {authUser?.role === 'student' && (
            <div className="figma-section-box" style={{ marginTop: 24 }}>
              <div className="figma-box-header">
                <div>
                  <h3 className="figma-box-title">
                    {isVi ? 'Phụ huynh & Người giám hộ' : 'Parents & Guardians'}
                  </h3>
                  <p className="figma-box-desc">
                    {isVi
                      ? 'Quản lý tài khoản phụ huynh được phép theo dõi tiến độ và bài viết của bạn.'
                      : 'Authorize parent accounts to monitor your learning progress and writing feedback.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="figma-pill-btn"
                  leftIcon="person_add"
                  onClick={handleGenerateLinkCode}
                  disabled={generatingLinkCode}
                >
                  {generatingLinkCode
                    ? (isVi ? 'Đang tạo…' : 'Generating…')
                    : linkCode
                      ? (isVi ? 'Mã mới' : 'New code')
                      : (isVi ? 'Thêm phụ huynh' : 'Add guardian')}
                </Button>
              </div>

              {linkCode && (
                <div className="figma-linkcode-box">
                  <div>
                    <div className="figma-linkcode-label">
                      {isVi ? 'Mã liên kết một lần của bạn' : 'One-time guardian link code'}
                    </div>
                    <strong className="figma-linkcode-val">{linkCode.code}</strong>
                    <div className="figma-linkcode-sub">
                      {linkCodeSecondsLeft > 0
                        ? `${isVi ? 'Hết hạn sau' : 'Expires in'} ${formatCountdown(linkCodeSecondsLeft)}`
                        : (isVi ? 'Mã đã hết hạn' : 'Code expired')}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="figma-pill-btn"
                    leftIcon={linkCodeCopied ? 'check' : 'content_copy'}
                    onClick={handleCopyLinkCode}
                  >
                    {linkCodeCopied ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}
                  </Button>
                </div>
              )}

              {/* Guardians list */}
              <div className="figma-guardians-list">
                {guardiansLoading ? (
                  <div className="figma-loading-row">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>{isVi ? 'Đang tải danh sách…' : 'Loading linked guardians…'}</span>
                  </div>
                ) : guardiansError ? (
                  <div className="figma-guardians-empty" style={{ borderColor: '#FE416D' }}>
                    <span className="material-symbols-outlined" style={{ color: '#FE416D' }}>error</span>
                    <div>
                      <p className="figma-empty-head">{guardiansError}</p>
                      <Button variant="secondary" size="sm" onClick={loadGuardians} style={{ marginTop: 6 }}>
                        {isVi ? 'Thử lại' : 'Retry'}
                      </Button>
                    </div>
                  </div>
                ) : guardians.length === 0 ? (
                  <div className="figma-guardians-empty">
                    <span className="material-symbols-outlined">family_restroom</span>
                    <div>
                      <p className="figma-empty-head">{isVi ? 'Chưa liên kết phụ huynh nào' : 'No guardians linked yet'}</p>
                      <p className="figma-empty-text">{isVi ? 'Tạo mã mời một lần để phụ huynh theo dõi tiến độ của bạn.' : 'Generate a one-time code to link a parent or guardian.'}</p>
                    </div>
                  </div>
                ) : (
                  guardians.map((g) => (
                    <div className="figma-guardian-item" key={g.linkId}>
                      <div className="figma-guardian-avatar">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="figma-guardian-details">
                        <strong>{g.parent.name}</strong>
                        <span>{g.parent.email}</span>
                      </div>
                      <div className="figma-guardian-rel">{formatRelationship(g.relationship)}</div>
                      <button
                        type="button"
                        className="figma-remove-btn"
                        onClick={() => handleRemoveGuardian(g)}
                        disabled={removingGuardianId === g.linkId}
                      >
                        <span className="material-symbols-outlined">person_remove</span>
                        <span>{isVi ? 'Gỡ' : 'Remove'}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. TAB 4: PAYMENT METHODS ── */}
      {activeTab === 'payment' && (
        <div className="figma-account-body figma-tab-container animate-fade-in">
          <div className="figma-section-box">
            <h3 className="figma-box-title">{isVi ? 'Gói Dịch Vụ Của Bạn' : 'Active Subscription'}</h3>
            <p className="figma-box-desc">{isVi ? 'Quản lý phương thức thanh toán và các gói học LexiGrow Pro.' : 'Manage payment cards and active learning tiers.'}</p>

            <div className="figma-plan-card">
              <div className="figma-plan-header">
                <div>
                  <span className="figma-badge-pro">PRO STUDENT</span>
                  <h4 className="figma-plan-title">{isVi ? 'LexiGrow Toàn Diện (Annual)' : 'LexiGrow All-Access Pass'}</h4>
                  <p className="figma-plan-desc">{isVi ? 'Gia hạn tiếp theo: 28/12/2026' : 'Next billing cycle: Dec 28, 2026'}</p>
                </div>
                <div className="figma-plan-price">
                  <strong>$24.92</strong>
                  <span>/ month</span>
                </div>
              </div>

              <div className="figma-plan-actions">
                <Button variant="primary" size="sm" className="figma-pill-cta" onClick={() => navigate('/pricing')}>
                  {isVi ? 'Nâng cấp gói' : 'Upgrade Plan'}
                </Button>
                <Button variant="outline" size="sm" className="figma-pill-btn">
                  {isVi ? 'Lịch sử thanh toán' : 'Billing Receipts'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. TAB 5: NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div className="figma-account-body figma-tab-container animate-fade-in">
          <div className="figma-section-box">
            <h3 className="figma-box-title">{isVi ? 'Cài Đặt Thông Báo' : 'Notification Preferences'}</h3>

            <div className="figma-toggle-list">
              <label className="figma-toggle-row">
                <div>
                  <strong>{isVi ? 'Nhắc nhở chuỗi học (Daily Streak)' : 'Daily Streak Reminders'}</strong>
                  <p>{isVi ? 'Nhận thông báo khi gần hết ngày mà chưa hoàn thành bài tập SRS.' : 'Get notified before your streak resets.'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifDailyStreak}
                  onChange={(e) => setNotifDailyStreak(e.target.checked)}
                  className="figma-switch"
                />
              </label>

              <label className="figma-toggle-row">
                <div>
                  <strong>{isVi ? 'Thông báo chấm bài AI' : 'Instant AI Essay Evaluation'}</strong>
                  <p>{isVi ? 'Nhận thông báo ngay khi bài viết được chấm điểm và phân tích.' : 'Receive an alert as soon as AI grades your draft.'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifAiEvaluation}
                  onChange={(e) => setNotifAiEvaluation(e.target.checked)}
                  className="figma-switch"
                />
              </label>

              <label className="figma-toggle-row">
                <div>
                  <strong>{isVi ? 'Bản tin khoá học mới & Ưu đãi' : 'New Courses & Special Offers'}</strong>
                  <p>{isVi ? 'Nhận khuyến mãi và các workshop viết luận miễn phí từ giảng viên.' : 'Hear about free writing webinars and discounts.'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifNewsletter}
                  onChange={(e) => setNotifNewsletter(e.target.checked)}
                  className="figma-switch"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. TAB 6: PRIVACY ── */}
      {activeTab === 'privacy' && (
        <div className="figma-account-body figma-tab-container animate-fade-in">
          <div className="figma-section-box">
            <h3 className="figma-box-title">{isVi ? 'Quyền Riêng Tư & Bảo Mật Dữ Liệu' : 'Data & Privacy'}</h3>

            <div className="figma-toggle-list">
              <label className="figma-toggle-row">
                <div>
                  <strong>{isVi ? 'Hồ sơ công khai' : 'Public Profile Visibility'}</strong>
                  <p>{isVi ? 'Cho phép học viên khác xem huy hiệu và thành tích của bạn.' : 'Allow other students to view your badges and garden tree.'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyPublicProfile}
                  onChange={(e) => setPrivacyPublicProfile(e.target.checked)}
                  className="figma-switch"
                />
              </label>

              <label className="figma-toggle-row">
                <div>
                  <strong>{isVi ? 'Xếp hạng Bảng vàng' : 'Show Rank on Leaderboards'}</strong>
                  <p>{isVi ? 'Hiển thị điểm từ vựng của bạn trên bảng xếp hạng tuần.' : 'Display your monthly vocabulary gains on the leaderboard.'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyShowRank}
                  onChange={(e) => setPrivacyShowRank(e.target.checked)}
                  className="figma-switch"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
