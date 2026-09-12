import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
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
    if (isAuthenticated && user) {
      navigate(getRoleHome(user.role, user))
    }
  }, [isAuthenticated, user, navigate])


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
    <div className="login-page">
      <div className="login__particles" aria-hidden="true">
        {PARTICLES.map((style, i) => (
          <span key={i} className="login__particle" style={style} />
        ))}
      </div>

      <main className="login__main">
        {/* Brand */}
        <div className="login__brand">
          <div className="login__logo">
            <span className="material-symbols-outlined" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
          </div>
          <h1 className="text-headline-lg">LexiGrow</h1>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {t('auth.loginSubtitle', 'Track your English writing growth with AI')}
          </p>
        </div>

        {/* Login Card */}
        <div className="login__card">
          {error && (
            <div style={{ background: 'var(--color-error-container, #fce4ec)', color: 'var(--color-error, #c62828)', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}
          {infoMessage && (
            <div style={{ background: 'var(--color-primary-container, #e8f0fe)', color: 'var(--color-primary, #1a73e8)', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
              {infoMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="login__form">
            {/* Email */}
            <div className="login__field">
              <label htmlFor="login-email" className="login__label text-label-md">{t('auth.emailLabel', 'Email Address')}</label>
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
              <label htmlFor="login-password" className="login__label text-label-md">{t('auth.passwordLabel', 'Password')}</label>
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
                <span className="text-label-md">{t('auth.rememberMe', 'Remember me')}</span>
              </label>
              <Link to="/forgot-password" className="login__forgot text-label-md">{t('auth.forgotPassword', 'Forgot password?')}</Link>
            </div>

            {/* Submit */}
            <button type="submit" className="login__submit" disabled={loading}>
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>{t('auth.loginBtn', 'Login')}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="login__divider">
              <span>{t('auth.orContinueWith', 'or continue with')}</span>
            </div>

            {/* Social */}
            <button type="button" className="login__social-btn" onClick={handleGoogleSignIn}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{t('auth.googleSignIn', 'Sign in with Google')}</span>
            </button>
          </form>
        </div>

        {/* Register CTA */}
        <div className="login__register-cta">
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <Link to="/register" className="login__register-link">{t('auth.createAccount', 'Create new account')}</Link>
          </p>
        </div>

        {/* Trust Badges */}
        <div className="login__badges">
          <div className="login__badge">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
            <span>{t('auth.secureSSL', 'Secure SSL Encryption')}</span>
          </div>
          <div className="login__badge">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shield</span>
            <span>{t('auth.dataPrivacy', 'Data Privacy Compliant')}</span>
          </div>
        </div>
      </main>

    </div>
  )
}
