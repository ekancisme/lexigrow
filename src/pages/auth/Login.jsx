import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import AuthLoadingOverlay from '../../components/auth/AuthLoadingOverlay.jsx'
import AuthThemeToggle from '../../components/auth/AuthThemeToggle.jsx'
import './Login.css'

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

// Static, deterministic particle set. Rendering these once in JSX (instead of
// creating DOM nodes on an interval) avoids layout thrash and per-frame JS.
// CSS animation handles motion and is disabled under prefers-reduced-motion.
const PARTICLES = Array.from({ length: 20 }, () => {
  const duration = 10 + Math.random() * 20
  const delay = -(Math.random() * duration)
  const drift = (Math.random() - 0.5) * 200
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    '--particle-drift': `${drift}px`,
  }
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const { login, loading, isAuthenticated, user, loginWithGoogle } = useAuth()
  const { t } = useLanguage()
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
      setError(err.message)
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
      // Fetch the Google Client ID from server config
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
            const loggedUser = await loginWithGoogle({ code: response.code })
            if (loggedUser) {
              navigate(getRoleHome(loggedUser.role, loggedUser))
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
    <div className="login-page" aria-busy={loading}>
      <AuthThemeToggle />
      <div className="login__particles" aria-hidden="true">
        {PARTICLES.map((style, i) => (
          <span key={i} className="login__particle" style={style} />
        ))}
      </div>

      <main className="login__main login__main--split">
        <div className="login__split-card">
          {/* Left Art Visual */}
          <div className="login__visual-side">
            <img src="/assets/auth/login-art.png" alt="Student Art Showcase" className="login__visual-img" />
            <div className="login__visual-overlay">
              <div className="login__creator-badge">
                <img src="/assets/lexigrow/educator-portrait-1.webp" alt="Jane" className="login__creator-avatar" />
                <div>
                  <strong>Jane LexiGrow</strong>
                  <span>Graphic Designer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="login__form-side">
            <div className="login__brand-header">
              <Link to="/student/home" className="login__brand-link">
                <img src="/assets/brand/lexigrow-emblem.png" alt="LexiGrow" width="38" height="38" className="login__logo-img" />
                <span className="login__brand-title">LexiGrow</span>
              </Link>
              <p className="login__brand-subtitle">
                {t('auth.loginSubtitle', 'Join us and get more benefits. We promise to keep your data safely.')}
              </p>
            </div>

            {error && (
              <div className="login__alert login__alert--error">
                {error}
              </div>
            )}
            {infoMessage && (
              <div className="login__alert login__alert--info">
                {infoMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login__form">
              {/* Email */}
              <div className="login__field">
                <label htmlFor="login-email" className="login__label">{t('auth.emailLabel', 'Email Address')}</label>
                <div className="login__input-wrap">
                  <span className="material-symbols-outlined login__input-icon">mail</span>
                  <input
                    id="login-email"
                    type="email"
                    className="login__input"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login__field">
                <label htmlFor="login-password" className="login__label">{t('auth.passwordLabel', 'Password')}</label>
                <div className="login__input-wrap">
                  <span className="material-symbols-outlined login__input-icon">lock</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login__input login__input--password"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="login__toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Utilities */}
              <div className="login__utilities">
                <label className="login__remember">
                  <input type="checkbox" className="login__checkbox" />
                  <span>{t('auth.rememberMe', 'Remember me')}</span>
                </label>
                <Link to="/forgot-password" className="login__forgot">{t('auth.forgotPassword', 'Forgot password?')}</Link>
              </div>

              {/* Submit */}
              <button type="submit" className="login__submit-figma" disabled={loading}>
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                    <span>{t('auth.loadingLogin', 'Signing in…')}</span>
                  </>
                ) : (
                  <span>{t('auth.loginBtn', 'Login')}</span>
                )}
              </button>

              {/* Divider */}
              <div className="login__divider-figma">
                <span>{t('auth.orYouCan', 'or you can')}</span>
              </div>

              {/* Social Stack */}
              <div className="login__social-stack">
                <button type="button" className="login__social-btn login__social-btn--facebook" onClick={() => {}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span>Continue with Facebook</span>
                </button>

                <button type="button" className="login__social-btn login__social-btn--apple" onClick={() => {}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-1 .04-2.18.66-2.79 1.41-.55.65-.99 1.7-1.01 2.76 1.13.09 2.19-.55 2.79-1.3"/></svg>
                  <span>Continue with Apple</span>
                </button>

                <button type="button" className="login__social-btn login__social-btn--google" onClick={handleGoogleSignIn}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Register CTA */}
              <div className="login__footer-prompt">
                <span>{t('auth.noAccount', 'Need an Account?')}{' '}</span>
                <Link to="/register" className="login__signup-link">
                  {t('auth.createAccount', 'Sign Up')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {loading && (
        <AuthLoadingOverlay
          title={t('auth.loadingLogin', 'Signing in…')}
          description={t('auth.loadingLoginDetail', 'Securely checking your account and preparing your session.')}
        />
      )}

    </div>
  )
}
