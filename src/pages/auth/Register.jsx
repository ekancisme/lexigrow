import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.css'

export default function Register() {
  const [role, setRole] = useState('student')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate(role === 'student' ? '/student/dashboard' : '/teacher/dashboard')
    }, 1500)
  }

  return (
    <div className="register-page">
      <main className="register__main">
        {/* Brand */}
        <div className="register__brand">
          <div className="register__logo">
            <span className="material-symbols-outlined" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
          </div>
          <h1 className="text-headline-lg">Create Account</h1>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Join LexiGrow and start tracking your vocabulary growth
          </p>
        </div>

        {/* Register Card */}
        <div className="register__card">
          {/* Role Selection */}
          <div className="register__roles">
            <button
              type="button"
              className={`register__role-btn ${role === 'student' ? 'register__role-btn--active' : ''}`}
              onClick={() => setRole('student')}
            >
              <span className="material-symbols-outlined">school</span>
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`register__role-btn ${role === 'teacher' ? 'register__role-btn--active' : ''}`}
              onClick={() => setRole('teacher')}
            >
              <span className="material-symbols-outlined">cast_for_education</span>
              <span>Teacher</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="register__form">
            {/* Name */}
            <div className="register__field">
              <label htmlFor="reg-name" className="register__label text-label-md">Full Name</label>
              <div className="register__input-wrap">
                <span className="material-symbols-outlined register__input-icon">person</span>
                <input id="reg-name" type="text" className="register__input" placeholder="Enter your full name" required />
              </div>
            </div>

            {/* Email */}
            <div className="register__field">
              <label htmlFor="reg-email" className="register__label text-label-md">Email Address</label>
              <div className="register__input-wrap">
                <span className="material-symbols-outlined register__input-icon">mail</span>
                <input id="reg-email" type="email" className="register__input" placeholder="name@example.com" required />
              </div>
            </div>

            {/* Password */}
            <div className="register__field">
              <label htmlFor="reg-password" className="register__label text-label-md">Password</label>
              <div className="register__input-wrap">
                <span className="material-symbols-outlined register__input-icon">lock</span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="register__input register__input--password"
                  placeholder="Create a password"
                  required
                />
                <button type="button" className="register__toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {role === 'student' && (
              <div className="register__field">
                <label htmlFor="reg-level" className="register__label text-label-md">English Level</label>
                <div className="register__input-wrap">
                  <span className="material-symbols-outlined register__input-icon">translate</span>
                  <select id="reg-level" className="register__input register__select">
                    <option value="">Select your level</option>
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Proficient</option>
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
            <button type="submit" className="register__submit" disabled={isLoading}>
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="register__divider">
              <span>or sign up with</span>
            </div>

            {/* Social */}
            <button type="button" className="register__social-btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Sign up with Google</span>
            </button>
          </form>
        </div>

        {/* Login CTA */}
        <div className="register__login-cta">
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Already have an account?{' '}
            <Link to="/login" className="register__login-link">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
