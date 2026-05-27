import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './Login.css'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [showGoogleMock, setShowGoogleMock] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleStep, setGoogleStep] = useState(1) // 1: choose email, 2: fill profile details
  const [googleRole, setGoogleRole] = useState('student')
  const { login, loading, isAuthenticated, user, loginWithGoogle, checkEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const particleRef = useRef(null)

  useEffect(() => {
    if (location.state?.infoMessage) {
      setInfoMessage(location.state.infoMessage)
    }
  }, [location.state])

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    createParticles()
    const interval = setInterval(createParticles, 15000)
    return () => clearInterval(interval)
  }, [])

  function createParticles() {
    const container = particleRef.current
    if (!container) return
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div')
      particle.className = 'login__particle'
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      const duration = 10 + Math.random() * 20
      const delay = Math.random() * 5
      particle.style.transition = `all ${duration}s linear ${delay}s`
      container.appendChild(particle)
      setTimeout(() => {
        particle.style.transform = `translateY(-${window.innerHeight}px) translateX(${(Math.random() - 0.5) * 200}px)`
        particle.style.opacity = '0'
      }, 100)
      setTimeout(() => particle.remove(), (duration + delay) * 1000)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const email = e.target['login-email'].value
    const password = e.target['login-password'].value

    try {
      const user = await login(email, password)
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleGoogleEmailSubmit(email, defaultName = '', defaultRole = 'student') {
    setError('')
    try {
      const exists = await checkEmail(email)
      if (exists) {
        setShowGoogleMock(false)
        setGoogleStep(1)
        const user = await loginWithGoogle({
          googleId: 'google_' + email.replace(/[@.]/g, '_'),
          email,
          name: defaultName || email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
          role: defaultRole
        })
        navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
      } else {
        setGoogleEmail(email)
        setGoogleRole(defaultRole)
        setGoogleStep(2)
      }
    } catch (err) {
      setError(err.message || 'Error checking email')
    }
  }

  async function handleGoogleRegisterSubmit(formData) {
    setShowGoogleMock(false)
    setGoogleStep(1)
    setError('')
    try {
      const user = await loginWithGoogle({
        googleId: 'google_' + googleEmail.replace(/[@.]/g, '_'),
        email: googleEmail,
        name: formData.name,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.name}`,
        role: formData.role,
        englishLevel: formData.role === 'student' ? formData.englishLevel : '',
        institution: formData.role === 'teacher' ? formData.institution : ''
      })
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.message || 'Google registration failed')
    }
  }

  return (
    <div className="login-page">
      <div className="login__particles" ref={particleRef} />

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
            Track your English writing growth with AI
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
              <label htmlFor="login-email" className="login__label text-label-md">Email Address</label>
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
              <label htmlFor="login-password" className="login__label text-label-md">Password</label>
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
                <span className="text-label-md">Remember me</span>
              </label>
              <Link to="/forgot-password" className="login__forgot text-label-md">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button type="submit" className="login__submit" disabled={loading}>
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Login</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="login__divider">
              <span>or continue with</span>
            </div>

            {/* Social */}
            <button type="button" className="login__social-btn" onClick={() => setShowGoogleMock(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </form>
        </div>

        {/* Register CTA */}
        <div className="login__register-cta">
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="login__register-link">Create new account</Link>
          </p>
        </div>

        {/* Trust Badges */}
        <div className="login__badges">
          <div className="login__badge">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
            <span>Secure SSL Encryption</span>
          </div>
          <div className="login__badge">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shield</span>
            <span>Data Privacy Compliant</span>
          </div>
        </div>
      </main>

      {/* Side Illustration (Desktop) */}
      <div className="login__illustration">
        <div className="login__illustration-visual">
          <div className="login__illustration-overlay">
            <div className="login__illustration-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-primary)' }}>trending_up</span>
            </div>
            <div>
              <div className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Daily Progress</div>
              <div className="text-title-lg" style={{ color: 'var(--color-primary)' }}>+24 New Words</div>
            </div>
          </div>
          <div className="login__illustration-bar">
            <div className="login__illustration-bar-fill" />
          </div>
        </div>
        <div>
          <h3 className="text-title-lg" style={{ marginBottom: 8 }}>Measured Clarity</h3>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Our AI analyzes your writing patterns to suggest precision vocabulary that elevates your professional communication.
          </p>
        </div>
      </div>

      {showGoogleMock && (
        <div className="google-mock-modal-overlay" onClick={() => { setShowGoogleMock(false); setGoogleStep(1); }}>
          <div className="google-mock-modal" onClick={e => e.stopPropagation()}>
            <div className="google-mock-modal__header">
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="google-mock-modal__title-text">Đăng nhập bằng Google</span>
              <button type="button" className="google-mock-modal__close" onClick={() => { setShowGoogleMock(false); setGoogleStep(1); }}>&times;</button>
            </div>
            <div className="google-mock-modal__body">
              {googleStep === 1 ? (
                <>
                  <div className="google-mock-center-header">
                    <div className="google-mock-lexigrow-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-primary)' }}>local_library</span>
                    </div>
                    <h2 className="google-mock-main-title">Chọn tài khoản</h2>
                    <p className="google-mock-main-subtitle">Tiếp tục tới <span style={{ color: 'var(--color-primary)' }}>LexiGrow</span></p>
                  </div>
                  
                  <div className="google-mock-accounts">
                    <div className="google-mock-account" onClick={() => handleGoogleEmailSubmit('lethecuong2k4@gmail.com', 'Cường', 'student')}>
                      <img src="https://api.dicebear.com/7.x/identicon/svg?seed=Cuong" alt="Cuong" className="google-mock-avatar" />
                      <div className="google-mock-info">
                        <span className="google-mock-name">Cường</span>
                        <span className="google-mock-email">lethecuong2k4@gmail.com</span>
                      </div>
                    </div>

                    <div className="google-mock-account" onClick={() => handleGoogleEmailSubmit('ekanc.isme@gmail.com', 'ekanC-', 'teacher')}>
                      <img src="https://api.dicebear.com/7.x/identicon/svg?seed=ekanC" alt="ekanC" className="google-mock-avatar" />
                      <div className="google-mock-info">
                        <span className="google-mock-name">ekanC-</span>
                        <span className="google-mock-email">ekanc.isme@gmail.com</span>
                      </div>
                    </div>

                    <div className="google-mock-account" onClick={() => handleGoogleEmailSubmit('thecuong6a@gmail.com', 'DZ Gaming', 'student')}>
                      <img src="https://api.dicebear.com/7.x/identicon/svg?seed=DZ" alt="DZ" className="google-mock-avatar" />
                      <div className="google-mock-info">
                        <span className="google-mock-name">DZ Gaming</span>
                        <span className="google-mock-email">thecuong6a@gmail.com</span>
                      </div>
                    </div>

                    <div className="google-mock-account" onClick={() => handleGoogleEmailSubmit('cuongmoi2k4@gmail.com', 'Cường Lê', 'student')}>
                      <img src="https://api.dicebear.com/7.x/identicon/svg?seed=Le" alt="Le" className="google-mock-avatar" />
                      <div className="google-mock-info">
                        <span className="google-mock-name">Cường Lê</span>
                        <span className="google-mock-email">cuongmoi2k4@gmail.com</span>
                      </div>
                    </div>

                    <div className="google-mock-account google-mock-account--use-other" onClick={() => setGoogleStep(3)}>
                      <div className="google-mock-avatar-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#e3e3e3' }}>account_circle</span>
                      </div>
                      <div className="google-mock-info">
                        <span className="google-mock-name" style={{ fontWeight: 'normal', color: '#e3e3e3' }}>Sử dụng một tài khoản khác</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : googleStep === 3 ? (
                <div className="google-mock-custom-input-view">
                  <div className="google-mock-center-header">
                    <div className="google-mock-lexigrow-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-primary)' }}>local_library</span>
                    </div>
                    <h2 className="google-mock-main-title">Sử dụng tài khoản khác</h2>
                    <p className="google-mock-main-subtitle">Đăng nhập bằng tài khoản Google của bạn</p>
                  </div>

                  <div style={{ marginTop: 24, textAlign: 'left' }}>
                    <input 
                      type="email" 
                      placeholder="Email hoặc số điện thoại" 
                      id="mock-google-email-input" 
                      className="google-mock-input-google" 
                    />
                    
                    <div className="google-mock-role-select" style={{ marginTop: 16 }}>
                      <label style={{ color: '#c4c7c5', fontSize: 13, display: 'block', marginBottom: 6 }}>Vai trò ban đầu:</label>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <label style={{ color: '#e3e3e3' }}>
                          <input type="radio" name="mock-google-initial-role" value="student" defaultChecked /> Học sinh
                        </label>
                        <label style={{ marginLeft: 16, color: '#e3e3e3' }}>
                          <input type="radio" name="mock-google-initial-role" value="teacher" /> Giáo viên
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                      <button 
                        type="button" 
                        className="google-mock-link-btn" 
                        onClick={() => setGoogleStep(1)}
                      >
                        Quay lại
                      </button>
                      <button 
                        type="button" 
                        className="google-mock-next-btn"
                        onClick={() => {
                          const emailInput = document.getElementById('mock-google-email-input')?.value
                          const roleInput = document.querySelector('input[name="mock-google-initial-role"]:checked')?.value
                          if (!emailInput) {
                            alert('Vui lòng nhập email')
                            return
                          }
                          handleGoogleEmailSubmit(emailInput, '', roleInput)
                        }}
                      >
                        Tiếp theo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="google-mock-registration-view" style={{ textAlign: 'left' }}>
                  <div className="google-mock-center-header">
                    <h2 className="google-mock-main-title" style={{ fontSize: 20 }}>Hoàn tất đăng ký</h2>
                    <p className="google-mock-main-subtitle">Email: <span style={{ color: '#8ab4f8' }}>{googleEmail}</span></p>
                  </div>
                  
                  <div style={{ marginTop: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#c4c7c5' }}>Họ và Tên</label>
                      <input type="text" placeholder="Nhập họ và tên đầy đủ" id="mock-google-reg-name" className="google-mock-input-google" />
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#c4c7c5' }}>Vai trò học tập</label>
                      <div className="google-mock-role-select">
                        <label style={{ color: '#e3e3e3' }}>
                          <input 
                            type="radio" 
                            name="mock-google-reg-role" 
                            value="student" 
                            checked={googleRole === 'student'} 
                            onChange={() => setGoogleRole('student')}
                          /> Học sinh
                        </label>
                        <label style={{ marginLeft: 24, color: '#e3e3e3' }}>
                          <input 
                            type="radio" 
                            name="mock-google-reg-role" 
                            value="teacher" 
                            checked={googleRole === 'teacher'} 
                            onChange={() => setGoogleRole('teacher')}
                          /> Giáo viên
                        </label>
                      </div>
                    </div>
                    
                    {googleRole === 'student' ? (
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#c4c7c5' }}>Trình độ tiếng Anh</label>
                        <select id="mock-google-reg-level" className="google-mock-input-google" style={{ appearance: 'auto', background: '#1e1e1f', color: '#e3e3e3' }}>
                          <option value="A1">A1 - Beginner</option>
                          <option value="A2">A2 - Elementary</option>
                          <option value="B1">B1 - Intermediate</option>
                          <option value="B2">B2 - Upper Intermediate</option>
                          <option value="C1">C1 - Advanced</option>
                          <option value="C2">C2 - Proficient</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#c4c7c5' }}>Trường học / Tổ chức giảng dạy</label>
                        <input type="text" placeholder="Ví dụ: Đại học Bách Khoa" id="mock-google-reg-institution" className="google-mock-input-google" />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                      <button type="button" className="google-mock-link-btn" onClick={() => setGoogleStep(1)}>
                        Quay lại
                      </button>
                      <button type="button" className="google-mock-next-btn" onClick={() => {
                        const name = document.getElementById('mock-google-reg-name')?.value
                        if (!name) {
                          alert('Vui lòng nhập họ tên')
                          return
                        }
                        const englishLevel = document.getElementById('mock-google-reg-level')?.value || ''
                        const institution = document.getElementById('mock-google-reg-institution')?.value || ''
                        handleGoogleRegisterSubmit({
                          name,
                          role: googleRole,
                          englishLevel,
                          institution
                        })
                      }}>
                        Đăng ký & Đăng nhập
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
