import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState(1) // 1: Send OTP, 2: Reset Password
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function handleSendCode(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.message || 'Verification code sent successfully. Please check your inbox.')
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please verify your email.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        code,
        newPassword
      })
      setMessage(response.message || 'Password reset successful!')
      setTimeout(() => {
        navigate('/login', { state: { infoMessage: 'Password reset successful. Please login with your new password.' } })
      }, 2500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <main className="forgot-password__main">
        {/* Brand */}
        <div className="forgot-password__brand">
          <div className="forgot-password__logo">
            <span className="material-symbols-outlined" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
          </div>
          <h1 className="text-headline-lg">Reset Password</h1>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {step === 1 ? 'Enter your email to receive a password reset code' : 'Enter the 6-digit code and your new password'}
          </p>
        </div>

        {/* Card */}
        <div className="forgot-password__card">
          {error && (
            <div style={{ background: 'var(--color-error-container, #fce4ec)', color: 'var(--color-error, #c62828)', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ background: 'var(--color-primary-container, #e8f0fe)', color: 'var(--color-primary, #1a73e8)', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
              {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="forgot-password__form">
              {/* Email */}
              <div className="forgot-password__field">
                <label htmlFor="fp-email" className="forgot-password__label text-label-md">Email Address</label>
                <div className="forgot-password__input-wrap">
                  <span className="material-symbols-outlined forgot-password__input-icon">mail</span>
                  <input
                    id="fp-email"
                    type="email"
                    className="forgot-password__input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="forgot-password__submit" disabled={loading}>
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="forgot-password__form">
              {/* Email (readonly display) */}
              <div className="forgot-password__field">
                <label className="forgot-password__label text-label-md">Email Address</label>
                <div className="forgot-password__input-wrap">
                  <span className="material-symbols-outlined forgot-password__input-icon" style={{ opacity: 0.5 }}>mail</span>
                  <input
                    type="email"
                    className="forgot-password__input"
                    value={email}
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                </div>
              </div>

              {/* Verification Code */}
              <div className="forgot-password__field">
                <label htmlFor="fp-code" className="forgot-password__label text-label-md">6-Digit Verification Code</label>
                <div className="forgot-password__input-wrap">
                  <span className="material-symbols-outlined forgot-password__input-icon">vpn_key</span>
                  <input
                    id="fp-code"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="forgot-password__input"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="forgot-password__field">
                <label htmlFor="fp-password" className="forgot-password__label text-label-md">New Password</label>
                <div className="forgot-password__input-wrap">
                  <span className="material-symbols-outlined forgot-password__input-icon">lock</span>
                  <input
                    id="fp-password"
                    type="password"
                    minLength={6}
                    className="forgot-password__input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="forgot-password__submit" disabled={loading}>
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to Login */}
        <div className="forgot-password__back-cta">
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Remembered your password?{' '}
            <Link to="/login" className="forgot-password__login-link">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
