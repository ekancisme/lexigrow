import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const particleRef = useRef(null)

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

  function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/student/dashboard')
    }, 1500)
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
              <a href="#" className="login__forgot text-label-md">Forgot password?</a>
            </div>

            {/* Submit */}
            <button type="submit" className="login__submit" disabled={isLoading}>
              {isLoading ? (
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
            <button type="button" className="login__social-btn">
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
    </div>
  )
}
