import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import AuthLoadingOverlay from '../../components/auth/AuthLoadingOverlay.jsx'
import AuthThemeToggle from '../../components/auth/AuthThemeToggle.jsx'
import './AuthModal.css'

function getRoleHome(role, user) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  if (role === 'parent') return '/parent/dashboard'
  if (role === 'student') {
    if (!user?.learningProfile?.onboardingCompleted) {
      return '/student/onboarding'
    }
    return '/student/dashboard'
  }
  return '/student/dashboard'
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const { login, loading, isAuthenticated, user, loginWithGoogle } = useAuth()
  const { t, language } = useLanguage()
  const isVi = language === 'vi'
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.infoMessage) {
      setInfoMessage(location.state.infoMessage)
    }
  }, [location.state])

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      navigate(getRoleHome(user.role, user))
    }
  }, [isAuthenticated, user, loading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const email = e.target['login-email'].value
    const password = e.target['login-password'].value

    try {
      const loggedUser = await login(email, password)
      navigate(getRoleHome(loggedUser.role, loggedUser))
    } catch (err) {
      setError(err.message || (isVi ? 'Đăng nhập không thành công' : 'Login failed'))
    }
  }

  // Google Sign-In using Google Identity Services (real OAuth)
  async function handleGoogleSignIn() {
    setError('')

    if (!window.google?.accounts?.oauth2) {
      setError(isVi ? 'Dịch vụ Google Sign-In chưa sẵn sàng. Vui lòng tải lại trang và thử lại.' : 'Google Sign-In is not available. Please refresh and try again.')
      return
    }

    try {
      const response = await fetch('/api/auth/config')
      const config = await response.json()

      if (!config.googleClientId) {
        setError(isVi ? 'Hệ thống chưa cấu hình Google OAuth.' : 'Google Sign-In is not configured on the server.')
        return
      }

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: config.googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (res) => {
          if (res.error) {
            setError(isVi ? 'Đăng nhập Google bị hủy hoặc thất bại.' : 'Google Sign-In was cancelled or failed.')
            return
          }
          try {
            const loggedUser = await loginWithGoogle({ code: res.code })
            if (loggedUser) {
              navigate(getRoleHome(loggedUser.role, loggedUser))
            }
          } catch (err) {
            setError(err.message || (isVi ? 'Xác thực Google thất bại' : 'Google authentication failed'))
          }
        },
      })

      client.requestCode()
    } catch {
      setError(isVi ? 'Khởi tạo Google Sign-In thất bại.' : 'Failed to initialize Google Sign-In.')
    }
  }

  return (
    <div className="auth-page" aria-busy={loading}>
      <div className="auth-page__theme-toggle">
        <AuthThemeToggle />
      </div>

      <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-login-title">
        {/* Close Button linking back to home */}
        <Link to="/student/home" className="auth-card__close-btn" aria-label="Close" title={isVi ? 'Quay lại Trang chủ' : 'Back to Home'}>
          ✕
        </Link>

        {/* Left Art Visual */}
        <div className="auth-card__visual">
          <img
            src="/assets/editorial/home/study-hero.jpg"
            alt="LexiGrow Academic Workspace"
            className="auth-card__visual-img"
          />
          <div className="auth-card__visual-overlay">
            <div className="auth-card__feature-badge">
              <div className="auth-card__feature-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>auto_awesome</span>
              </div>
              <div className="auth-card__feature-info">
                <span className="auth-card__feature-title">LexiGrow AI Learning Lab</span>
                <span className="auth-card__feature-subtitle">
                  {isVi
                    ? 'Chấm chữa bài viết AI thời gian thực & Spaced Repetition'
                    : 'Real-time AI Essay Feedback & Spaced Repetition'}
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
            <h1 id="auth-login-title" className="auth-card__page-title">
              {t('auth.loginTitle', 'Đăng nhập')}
            </h1>
            <p className="auth-card__subtitle">
              {t('auth.loginSubtitle', 'Tham gia cùng LexiGrow để làm chủ từ vựng và nâng cao kỹ năng viết chuẩn CEFR.')}
            </p>
          </div>

          {error && (
            <div className="auth-card__alert auth-card__alert--error">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              <span>{error}</span>
            </div>
          )}
          {infoMessage && (
            <div className="auth-card__alert auth-card__alert--info">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-card__form">
            {/* Email Address */}
            <div className="auth-card__field">
              <label htmlFor="login-email" className="auth-card__label">
                {t('auth.emailLabel', 'Email Address')}
              </label>
              <div className="auth-card__input-wrap">
                <span className="material-symbols-outlined auth-card__input-icon">mail</span>
                <input
                  id="login-email"
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
              <label htmlFor="login-password" className="auth-card__label">
                {t('auth.passwordLabel', 'Password')}
              </label>
              <div className="auth-card__input-wrap">
                <span className="material-symbols-outlined auth-card__input-icon">lock</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-card__input auth-card__input--password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
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

            {/* Remember Me & Forgot Password */}
            <div className="auth-card__utilities">
              <label className="auth-card__remember">
                <input type="checkbox" className="auth-card__checkbox" />
                <span>{t('auth.rememberMe', 'Ghi nhớ đăng nhập')}</span>
              </label>
              <Link to="/forgot-password" className="auth-card__forgot-link">
                {t('auth.forgotPassword', 'Quên mật khẩu?')}
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-card__submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" aria-hidden="true" style={{ fontSize: 18 }}>
                    progress_activity
                  </span>
                  <span>{t('auth.loadingLogin', 'Đang đăng nhập…')}</span>
                </>
              ) : (
                <span>{t('auth.loginBtn', 'Đăng nhập')}</span>
              )}
            </button>

            {/* Divider */}
            <div className="auth-card__divider">
              <span>{t('auth.orYouCan', 'hoặc đăng nhập bằng')}</span>
            </div>

            {/* Google OAuth Button (Only Google as requested) */}
            <button
              type="button"
              className="auth-card__google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{t('auth.continueWithGoogle', 'Tiếp tục với Google')}</span>
            </button>

            {/* Register CTA */}
            <div className="auth-card__footer-prompt">
              <span>{t('auth.noAccount', 'Chưa có tài khoản?')}{' '}</span>
              <Link to="/register" className="auth-card__switch-link">
                {t('auth.createAccount', 'Đăng ký ngay')}
              </Link>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <AuthLoadingOverlay
          title={t('auth.loadingLogin', 'Đang đăng nhập…')}
          description={t('auth.loadingLoginDetail', 'Kiểm tra thông tin tài khoản an toàn và khởi tạo phiên làm việc.')}
        />
      )}
    </div>
  )
}
