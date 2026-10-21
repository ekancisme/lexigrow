import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import AuthLoadingOverlay from '../../components/auth/AuthLoadingOverlay.jsx'
import AuthThemeToggle from '../../components/auth/AuthThemeToggle.jsx'
import './AuthModal.css'

export default function Register() {
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Verification states
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const { register, verifyEmail, loading, loginWithGoogle } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    const formData = {
      name: e.target['reg-name'].value,
      email: e.target['reg-email'].value,
      password: e.target['reg-password'].value,
      role,
      englishLevel: role === 'student' ? (e.target['reg-level']?.value || '') : '',
      institution: role === 'teacher' ? (e.target['reg-institution']?.value || '') : '',
    }

    try {
      const res = await register(formData)
      setVerificationEmail(formData.email)
      setSuccessMessage(res.message || 'Mã xác thực 6 chữ số đã được gửi tới email của bạn.')
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.')
    }
  }

  async function handleVerifySubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsVerifying(true)

    try {
      const res = await verifyEmail(verificationEmail, verificationCode)
      if (res && res.pendingApproval) {
        setSuccessMessage(res.message || 'Xác thực thành công! Tài khoản đang chờ Quản trị viên duyệt.')
        setTimeout(() => {
          navigate('/login')
        }, 4000)
        return
      }

      const user = res
      if (user && user.role === 'student') {
        navigate('/student/onboarding')
      } else if (user && user.role === 'teacher') {
        navigate('/teacher/dashboard')
      } else if (user && user.role === 'parent') {
        navigate('/parent/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Mã xác thực không chính xác hoặc đã hết hạn.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResendCode() {
    setError('')
    setSuccessMessage('')
    try {
      const res = await api.post('/auth/resend-verify', { email: verificationEmail })
      setSuccessMessage(res.message || 'Đã gửi lại mã xác thực tới email của bạn!')
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã xác thực.')
    }
  }

  // Google Sign-In using Google Identity Services (real OAuth)
  async function handleGoogleSignIn() {
    setError('')

    if (!window.google?.accounts?.oauth2) {
      setError('Google Sign-In is not available. Please refresh and try again.')
      return
    }

    try {
      const response = await fetch('/api/auth/config')
      const config = await response.json()

      if (!config.googleClientId) {
        setError('Google Sign-In is not configured on the server.')
        return
      }

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: config.googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.error) {
            setError('Google Sign-In was cancelled or failed.')
            return
          }
          try {
            const loggedInUser = await loginWithGoogle({
              code: response.code,
              role,
            })
            if (loggedInUser.role === 'teacher') {
              navigate('/teacher/dashboard')
            } else if (loggedInUser.role === 'parent') {
              navigate('/parent/dashboard')
            } else if (loggedInUser.role === 'student') {
              if (!loggedInUser.learningProfile?.onboardingCompleted) {
                navigate('/student/onboarding')
              } else {
                navigate('/student/dashboard')
              }
            } else {
              navigate('/student/dashboard')
            }
          } catch (err) {
            setError(err.message || 'Google authentication failed')
          }
        },
      })

      client.requestCode()
    } catch (err) {
      setError('Failed to initialize Google Sign-In.')
    }
  }

  return (
    <div className="auth-page" aria-busy={loading || isVerifying}>
      <div className="auth-page__theme-toggle">
        <AuthThemeToggle />
      </div>

      <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-register-title">
        {/* Close Button linking back to home */}
        <Link to="/student/home" className="auth-card__close-btn" aria-label="Close" title="Quay lại Trang chủ">
          ✕
        </Link>

        {/* Left Art Visual */}
        <div className="auth-card__visual">
          <img
            src="/assets/lexigrow/writing-practice.webp"
            alt="LexiGrow Guided English Writing"
            className="auth-card__visual-img"
          />
          <div className="auth-card__visual-overlay">
            <div className="auth-card__mentor-badge">
              <img
                src="/assets/editorial/instructors/sarasvati.png"
                alt="Sarah Jenkins"
                className="auth-card__mentor-avatar"
              />
              <div className="auth-card__mentor-info">
                <span className="auth-card__mentor-name">Sarah Jenkins</span>
                <span className="auth-card__mentor-role">
                  {t('auth.taglineRegister', 'Senior IELTS Academic Coach')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="auth-card__form-side">
          <div className="auth-card__brand-header">
            <Link to="/student/home" className="auth-card__brand-link">
              <img
                src="/assets/brand/lexigrow-emblem.png"
                alt="LexiGrow"
                className="auth-card__brand-emblem"
              />
              <span className="auth-card__brand-name">LexiGrow</span>
            </Link>
            <h1 id="auth-register-title" className="auth-card__page-title">
              {verificationEmail ? t('auth.verifyTitle', 'Xác thực Email') : t('auth.registerTitle', 'Tạo tài khoản mới')}
            </h1>
            <p className="auth-card__subtitle">
              {verificationEmail
                ? t('auth.verifySubtitle', 'Nhập mã gồm 6 chữ số đã được gửi tới email của bạn để kích hoạt tài khoản.')
                : t('auth.registerSubtitle', 'Gia nhập cộng đồng người học LexiGrow và bắt đầu lộ trình làm chủ tiếng Anh.')}
            </p>
          </div>

          {error && (
            <div className="auth-card__alert auth-card__alert--error">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-card__alert auth-card__alert--info">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {verificationEmail ? (
            /* VERIFICATION STEP */
            <form onSubmit={handleVerifySubmit} className="auth-card__form">
              <div className="auth-card__field">
                <label className="auth-card__label" htmlFor="verify-pin">
                  {t('auth.verificationCode', 'Mã xác thực 6 chữ số')}
                </label>
                <div className="auth-card__input-wrap">
                  <span className="material-symbols-outlined auth-card__input-icon">pin</span>
                  <input
                    id="verify-pin"
                    type="text"
                    className="auth-card__input auth-card__pin-input"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.trim())}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-card__submit-btn" disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" aria-hidden="true" style={{ fontSize: 18 }}>
                      progress_activity
                    </span>
                    <span>{t('auth.loadingVerify', 'Đang xác thực…')}</span>
                  </>
                ) : (
                  <span>{t('auth.verifyBtn', 'Xác nhận & Kích hoạt')}</span>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--figma-primary, #3DCBB1)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: 0,
                  }}
                >
                  {t('auth.resendCode', 'Gửi lại mã')}
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationEmail('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-on-surface-variant, #64748B)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: 0,
                  }}
                >
                  {t('auth.backToRegister', 'Quay lại Đăng ký')}
                </button>
              </div>
            </form>
          ) : (
            /* REGISTRATION STEP */
            <>
              {/* Role Selector Tabs */}
              <div className="auth-card__roles-grid">
                <button
                  type="button"
                  className={`auth-card__role-pill ${role === 'student' ? 'auth-card__role-pill--active' : ''}`}
                  onClick={() => setRole('student')}
                >
                  <span className="material-symbols-outlined">school</span>
                  <span>{t('auth.roleStudent', 'Học viên')}</span>
                </button>
                <button
                  type="button"
                  className={`auth-card__role-pill ${role === 'teacher' ? 'auth-card__role-pill--active' : ''}`}
                  onClick={() => setRole('teacher')}
                >
                  <span className="material-symbols-outlined">cast_for_education</span>
                  <span>{t('auth.roleTeacher', 'Giảng viên')}</span>
                </button>
                <button
                  type="button"
                  className={`auth-card__role-pill ${role === 'parent' ? 'auth-card__role-pill--active' : ''}`}
                  onClick={() => setRole('parent')}
                >
                  <span className="material-symbols-outlined">family_restroom</span>
                  <span>{t('auth.roleParent', 'Phụ huynh')}</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="auth-card__form">
                {/* Full Name */}
                <div className="auth-card__field">
                  <label htmlFor="reg-name" className="auth-card__label">
                    {t('auth.fullName', 'Họ và tên')}
                  </label>
                  <div className="auth-card__input-wrap">
                    <span className="material-symbols-outlined auth-card__input-icon">person</span>
                    <input
                      id="reg-name"
                      type="text"
                      className="auth-card__input"
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="auth-card__field">
                  <label htmlFor="reg-email" className="auth-card__label">
                    {t('auth.emailLabel', 'Email Address')}
                  </label>
                  <div className="auth-card__input-wrap">
                    <span className="material-symbols-outlined auth-card__input-icon">mail</span>
                    <input
                      id="reg-email"
                      type="email"
                      className="auth-card__input"
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-card__field">
                  <label htmlFor="reg-password" className="auth-card__label">
                    {t('auth.passwordLabel', 'Mật khẩu')}
                  </label>
                  <div className="auth-card__input-wrap">
                    <span className="material-symbols-outlined auth-card__input-icon">lock</span>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-card__input auth-card__input--password"
                      placeholder="Ít nhất 6 ký tự"
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="auth-card__toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Student: CEFR Level */}
                {role === 'student' && (
                  <div className="auth-card__field">
                    <label htmlFor="reg-level" className="auth-card__label">
                      {t('auth.englishLevel', 'Trình độ tiếng Anh hiện tại')}
                    </label>
                    <div className="auth-card__input-wrap">
                      <span className="material-symbols-outlined auth-card__input-icon">bar_chart</span>
                      <select id="reg-level" className="auth-card__input auth-card__select" defaultValue="A2">
                        <option value="A1">A1 - Căn bản (Beginner)</option>
                        <option value="A2">A2 - Sơ cấp (Elementary)</option>
                        <option value="B1">B1 - Trung cấp (Intermediate)</option>
                        <option value="B2">B2 - Trung cao cấp (Upper Intermediate)</option>
                        <option value="C1">C1 - Cao cấp (Advanced)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Teacher: Institution */}
                {role === 'teacher' && (
                  <div className="auth-card__field">
                    <label htmlFor="reg-institution" className="auth-card__label">
                      {t('auth.institution', 'Trường / Trung tâm đào tạo')}
                    </label>
                    <div className="auth-card__input-wrap">
                      <span className="material-symbols-outlined auth-card__input-icon">apartment</span>
                      <input
                        id="reg-institution"
                        type="text"
                        className="auth-card__input"
                        placeholder="Tên trường học hoặc tổ chức giáo dục"
                      />
                    </div>
                  </div>
                )}

                {/* Terms agreement */}
                <label className="auth-card__terms">
                  <input type="checkbox" className="auth-card__checkbox" required />
                  <span>
                    Tôi đồng ý với <a href="#terms">Điều khoản sử dụng</a> và <a href="#privacy">Chính sách bảo mật</a> của LexiGrow.
                  </span>
                </label>

                {/* Submit Button */}
                <button type="submit" className="auth-card__submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" aria-hidden="true" style={{ fontSize: 18 }}>
                        progress_activity
                      </span>
                      <span>{t('auth.loadingRegister', 'Đang tạo tài khoản…')}</span>
                    </>
                  ) : (
                    <span>{t('auth.registerBtn', 'Tạo tài khoản')}</span>
                  )}
                </button>

                {/* Divider */}
                <div className="auth-card__divider">
                  <span>{t('auth.orYouCan', 'hoặc đăng ký bằng')}</span>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  className="auth-card__google-btn"
                  onClick={handleGoogleSignIn}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{t('auth.continueWithGoogle', 'Tiếp tục với Google')}</span>
                </button>

                {/* Sign In CTA */}
                <div className="auth-card__footer-prompt">
                  <span>{t('auth.alreadyHaveAccount', 'Đã có tài khoản?')}{' '}</span>
                  <Link to="/login" className="auth-card__switch-link">
                    {t('auth.loginBtn', 'Đăng nhập ngay')}
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {(loading || isVerifying) && (
        <AuthLoadingOverlay
          title={
            isVerifying
              ? t('auth.loadingVerify', 'Đang xác thực tài khoản…')
              : t('auth.loadingRegister', 'Đang tạo tài khoản…')
          }
          description={
            isVerifying
              ? t('auth.loadingVerifyDetail', 'Hệ thống đang kiểm tra mã xác thực của bạn.')
              : t('auth.loadingRegisterDetail', 'Đang khởi tạo hồ sơ học tập và chuẩn bị môi trường cho bạn.')
          }
        />
      )}
    </div>
  )
}
