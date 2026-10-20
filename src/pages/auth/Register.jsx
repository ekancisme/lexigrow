import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import AuthLoadingOverlay from '../../components/auth/AuthLoadingOverlay.jsx'
import AuthThemeToggle from '../../components/auth/AuthThemeToggle.jsx'
import './Register.css'

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
      setSuccessMessage(res.message || 'A verification code has been sent to your email.')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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
        setSuccessMessage(res.message || 'Verification successful! Your account is pending Admin approval.')
        setTimeout(() => {
          navigate('/login')
        }, 5000)
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
      setError(err.message || 'The verification code is incorrect or has expired.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResendCode() {
    setError('')
    setSuccessMessage('')
    try {
      const res = await api.post('/auth/resend-verify', { email: verificationEmail })
      setSuccessMessage(res.message || 'Verification code resent!')
    } catch (err) {
      setError(err.message || 'Unable to resend verification code.')
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
    <div className="register-page" aria-busy={loading || isVerifying}>
      <AuthThemeToggle />
      <main className="login__main login__main--split">
        <div className="login__split-card">
          {/* Left Art Visual */}
          <div className="login__visual-side">
            <img src="/assets/auth/signup-art.png" alt="Student Showcase" className="login__visual-img" />
            <div className="login__visual-overlay">
              <div className="login__creator-badge">
                <img src="/assets/lexigrow/educator-portrait-2.webp" alt="Joe" className="login__creator-avatar" />
                <div>
                  <strong>Joe Kitanoe</strong>
                  <span>Software Developer</span>
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
              <h1 className="text-headline-md" style={{ margin: '4px 0 6px', fontWeight: 800 }}>
                {verificationEmail ? 'Verify Your Email' : t('auth.registerTitle', 'Create Account')}
              </h1>
              <p className="login__brand-subtitle">
                {verificationEmail 
                  ? 'Enter the 6-digit verification code to activate your account.'
                  : t('auth.registerSubtitle', 'Join us and get more benefits. We promise to keep your data safely.')
                }
              </p>
            </div>

            {error && (
              <div className="login__alert login__alert--error">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="login__alert login__alert--info">
                {successMessage}
              </div>
            )}

            {verificationEmail ? (
              /* VERIFICATION FORM STEP */
              <form onSubmit={handleVerifySubmit} className="register__form">
                <div className="register__field">
                  <label className="register__label text-label-md">Verification Code</label>
                  <div className="register__input-wrap">
                    <span className="material-symbols-outlined register__input-icon">pin</span>
                    <input 
                      type="text" 
                      className="register__input" 
                      style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }} 
                      maxLength={6} 
                      placeholder="X X X X X X" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="login__submit-figma" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                      <span>{t('auth.loadingVerify', 'Verifying…')}</span>
                    </>
                  ) : (
                    <span>Verify & Activate</span>
                  )}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <button 
                    type="button" 
                    onClick={handleResendCode}
                    style={{ background: 'none', border: 'none', color: 'var(--figma-primary, #3DCBB1)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}
                  >
                    Resend Code
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setVerificationEmail(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-outline)', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                  >
                    Back to Register
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM STEP */
              <>
                {/* Social Stack First (Figma style) */}
                <div className="login__social-stack" style={{ marginBottom: 16 }}>
                  <button type="button" className="login__social-btn login__social-btn--facebook" onClick={() => {}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span>Sign Up with Facebook</span>
                  </button>

                  <button type="button" className="login__social-btn login__social-btn--apple" onClick={() => {}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-1 .04-2.18.66-2.79 1.41-.55.65-.99 1.7-1.01 2.76 1.13.09 2.19-.55 2.79-1.3"/></svg>
                    <span>Sign Up with Apple</span>
                  </button>

                  <button type="button" className="login__social-btn login__social-btn--google" onClick={handleGoogleSignIn}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Sign Up with Google</span>
                  </button>
                </div>

                <div className="login__divider-figma">
                  <span>{t('auth.orYouCan', 'or you can')}</span>
                </div>

                {/* Role Selection */}
                <div className="register__roles">
                  <button
                    type="button"
                    className={`register__role-btn ${role === 'student' ? 'register__role-btn--active' : ''}`}
                    onClick={() => setRole('student')}
                  >
                    <span className="material-symbols-outlined">school</span>
                    <span>{t('auth.roleStudent', 'Student')}</span>
                  </button>
                  <button
                    type="button"
                    className={`register__role-btn ${role === 'teacher' ? 'register__role-btn--active' : ''}`}
                    onClick={() => setRole('teacher')}
                  >
                    <span className="material-symbols-outlined">cast_for_education</span>
                    <span>{t('auth.roleTeacher', 'Teacher')}</span>
                  </button>
                  <button
                    type="button"
                    className={`register__role-btn ${role === 'parent' ? 'register__role-btn--active' : ''}`}
                    onClick={() => setRole('parent')}
                  >
                    <span className="material-symbols-outlined">family_restroom</span>
                    <span>{t('auth.roleParent', 'Parent')}</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="register__form">
                  {/* Name */}
                  <div className="register__field">
                    <label htmlFor="reg-name" className="register__label text-label-md">{t('auth.fullName', 'Full Name')}</label>
                    <div className="register__input-wrap">
                      <span className="material-symbols-outlined register__input-icon">person</span>
                      <input id="reg-name" type="text" className="register__input" placeholder="Enter your full name" required />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="register__field">
                    <label htmlFor="reg-email" className="register__label text-label-md">{t('auth.emailLabel', 'Email Address')}</label>
                    <div className="register__input-wrap">
                      <span className="material-symbols-outlined register__input-icon">mail</span>
                      <input id="reg-email" type="email" className="register__input" placeholder="name@example.com" required />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="register__field">
                    <label htmlFor="reg-password" className="register__label text-label-md">{t('auth.passwordLabel', 'Password')}</label>
                    <div className="register__input-wrap">
                      <span className="material-symbols-outlined register__input-icon">lock</span>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        className="register__input register__input--password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="register__toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Level selection for student */}
                  {role === 'student' && (
                    <div className="register__field">
                      <label htmlFor="reg-level" className="register__label text-label-md">{t('auth.englishLevel', 'Current English Level')}</label>
                      <div className="register__input-wrap">
                        <span className="material-symbols-outlined register__input-icon">bar_chart</span>
                        <select id="reg-level" className="register__input register__select" defaultValue="A2">
                          <option value="A1">A1 - Beginner</option>
                          <option value="A2">A2 - Elementary</option>
                          <option value="B1">B1 - Intermediate</option>
                          <option value="B2">B2 - Upper Intermediate</option>
                          <option value="C1">C1 - Advanced</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {role === 'teacher' && (
                    <div className="register__field">
                      <label htmlFor="reg-institution" className="register__label text-label-md">Institution</label>
                      <div className="register__input-wrap">
                        <span className="material-symbols-outlined register__input-icon">apartment</span>
                        <input id="reg-institution" type="text" className="register__input" placeholder="Your school or institution" />
                      </div>
                    </div>
                  )}

                  {/* Terms */}
                  <label className="register__terms">
                    <input type="checkbox" className="register__checkbox" required />
                    <span className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                      I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                    </span>
                  </label>

                  {/* Submit */}
                  <button type="submit" className="login__submit-figma" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                        <span>{t('auth.loadingRegister', 'Creating account…')}</span>
                      </>
                    ) : (
                      <span>{t('auth.registerBtn', 'Create Account')}</span>
                    )}
                  </button>
                </form>

                {/* Login CTA */}
                <div className="login__footer-prompt">
                  <span>{t('auth.alreadyHaveAccount', 'Already have an Account?')}{' '}</span>
                  <Link to="/login" className="login__signup-link">
                    {t('auth.loginBtn', 'Sign In')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      {(loading || isVerifying) && (
        <AuthLoadingOverlay
          title={isVerifying
            ? t('auth.loadingVerify', 'Verifying your account…')
            : t('auth.loadingRegister', 'Creating your account…')}
          description={isVerifying
            ? t('auth.loadingVerifyDetail', 'Please wait while we confirm your verification code.')
            : t('auth.loadingRegisterDetail', 'Please wait while we create your account and send the verification email.')}
        />
      )}
    </div>
  )
}
