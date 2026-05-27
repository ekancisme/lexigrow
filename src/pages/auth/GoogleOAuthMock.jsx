import { useState } from 'react'
import api from '../../services/api.js'
import './GoogleOAuthMock.css'

export default function GoogleOAuthMock() {
  const [step, setStep] = useState(1) // 1: choose account, 2: input email, 3: registration details
  const [selectedEmail, setSelectedEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [englishLevel, setEnglishLevel] = useState('A1')
  const [institution, setInstitution] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Hardcoded mockup accounts for quick testing
  const mockAccounts = [
    { name: 'Nguyễn Văn A', email: 'nva@gmail.com', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=nva' },
    { name: 'DZ Gaming', email: 'thecuong6a@gmail.com', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DZ' },
    { name: 'WarmHouse Charity', email: 'warmhouse.charity.contact@gmail.com', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=warmhouse' }
  ]

  const handleAccountSelect = async (account) => {
    setError('')
    setLoading(true)
    try {
      // Check if email already registered
      const response = await api.post('/auth/check-email', { email: account.email })
      if (response.exists) {
        // Log in directly via parent
        sendGoogleProfile({
          googleId: 'google_' + account.email.replace(/[@.]/g, '_'),
          email: account.email,
          name: account.name,
          avatar: account.avatar,
          role: 'student' // default, backend will resolve actual if exists
        })
      } else {
        // Go to registration details (step 3)
        setSelectedEmail(account.email)
        setName(account.name)
        setRole('student')
        setStep(3)
      }
    } catch (err) {
      setError(err.message || 'Error occurred while selecting account.')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomEmailSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEmail) return
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/check-email', { email: selectedEmail })
      if (response.exists) {
        // Log in directly via parent
        sendGoogleProfile({
          googleId: 'google_' + selectedEmail.replace(/[@.]/g, '_'),
          email: selectedEmail,
          name: selectedEmail.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedEmail}`,
          role: role
        })
      } else {
        // Go to step 3
        setName(selectedEmail.split('@')[0])
        setStep(3)
      }
    } catch (err) {
      setError(err.message || 'Error checking email.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    if (!name) {
      setError('Vui lòng nhập họ và tên')
      return
    }
    
    sendGoogleProfile({
      googleId: 'google_' + selectedEmail.replace(/[@.]/g, '_'),
      email: selectedEmail,
      name: name,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      role: role,
      englishLevel: role === 'student' ? englishLevel : '',
      institution: role === 'teacher' ? institution : ''
    })
  }

  const sendGoogleProfile = (profile) => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_PROFILE_SELECTED',
        profile
      }, window.location.origin)
      window.close()
    } else {
      setError('Không tìm thấy cửa sổ gốc. Vui lòng đăng nhập lại.')
    }
  }

  return (
    <div className="google-oauth-mock-container">
      <div className="google-oauth-mock-card">
        {/* Header with Google Logo */}
        <div className="google-oauth-mock-header">
          <svg className="google-logo" viewBox="0 0 24 24" width="32" height="32">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          
          {step === 1 && (
            <>
              <h1 className="google-oauth-title">Chọn tài khoản</h1>
              <p className="google-oauth-subtitle">để tiếp tục tới <span>LexiGrow</span></p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="google-oauth-title">Đăng nhập</h1>
              <p className="google-oauth-subtitle">sử dụng Tài khoản Google của bạn</p>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="google-oauth-title">Hoàn tất thông tin</h1>
              <p className="google-oauth-subtitle">để tạo tài khoản mới trên <span>LexiGrow</span></p>
            </>
          )}
        </div>

        {error && <div className="google-oauth-error">{error}</div>}

        {loading ? (
          <div className="google-oauth-loader-wrap">
            <div className="google-oauth-loader"></div>
            <p>Đang kết nối...</p>
          </div>
        ) : (
          <div className="google-oauth-body">
            {/* Step 1: Choose account */}
            {step === 1 && (
              <div className="google-accounts-list">
                {mockAccounts.map((account, index) => (
                  <button 
                    key={index} 
                    className="google-account-row" 
                    onClick={() => handleAccountSelect(account)}
                  >
                    <img src={account.avatar} alt={account.name} className="google-account-avatar" />
                    <div className="google-account-info">
                      <div className="google-account-name">{account.name}</div>
                      <div className="google-account-email">{account.email}</div>
                    </div>
                  </button>
                ))}

                <button className="google-account-row google-use-another" onClick={() => setStep(2)}>
                  <div className="google-avatar-icon-wrap">
                    <span className="material-symbols-outlined">account_circle</span>
                  </div>
                  <div className="google-account-info">
                    <div className="google-account-name" style={{ color: '#a8c7fa', fontWeight: '500' }}>
                      Sử dụng một tài khoản khác
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Use another email */}
            {step === 2 && (
              <form onSubmit={handleCustomEmailSubmit} className="google-oauth-form">
                <div className="google-field">
                  <input
                    type="email"
                    placeholder="Email hoặc số điện thoại"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    className="google-input"
                    required
                  />
                  <div className="google-forgot-email">Bạn quên địa chỉ email?</div>
                </div>

                <div className="google-field" style={{ marginTop: 24 }}>
                  <label className="google-field-label">Chọn vai trò của bạn</label>
                  <div className="google-role-radios">
                    <label>
                      <input 
                        type="radio" 
                        name="oauth-role" 
                        value="student" 
                        checked={role === 'student'} 
                        onChange={() => setRole('student')} 
                      />
                      <span>Học sinh</span>
                    </label>
                    <label style={{ marginLeft: 24 }}>
                      <input 
                        type="radio" 
                        name="oauth-role" 
                        value="teacher" 
                        checked={role === 'teacher'} 
                        onChange={() => setRole('teacher')} 
                      />
                      <span>Giáo viên</span>
                    </label>
                  </div>
                </div>

                <div className="google-actions">
                  <button type="button" className="google-btn-text" onClick={() => setStep(1)}>
                    Quay lại
                  </button>
                  <button type="submit" className="google-btn-primary">
                    Tiếp theo
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Complete registration */}
            {step === 3 && (
              <form onSubmit={handleRegisterSubmit} className="google-oauth-form">
                <div className="google-email-badge">
                  <span className="material-symbols-outlined">account_circle</span>
                  <span>{selectedEmail}</span>
                </div>

                <div className="google-field" style={{ marginTop: 20 }}>
                  <label className="google-field-label">Họ và Tên</label>
                  <input
                    type="text"
                    placeholder="Nhập tên của bạn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="google-input"
                    required
                  />
                </div>

                <div className="google-field" style={{ marginTop: 16 }}>
                  <label className="google-field-label">Vai trò</label>
                  <div className="google-role-radios">
                    <label>
                      <input 
                        type="radio" 
                        name="oauth-reg-role" 
                        value="student" 
                        checked={role === 'student'} 
                        onChange={() => setRole('student')} 
                      />
                      <span>Học sinh</span>
                    </label>
                    <label style={{ marginLeft: 24 }}>
                      <input 
                        type="radio" 
                        name="oauth-reg-role" 
                        value="teacher" 
                        checked={role === 'teacher'} 
                        onChange={() => setRole('teacher')} 
                      />
                      <span>Giáo viên</span>
                    </label>
                  </div>
                </div>

                {role === 'student' ? (
                  <div className="google-field" style={{ marginTop: 16 }}>
                    <label className="google-field-label">Trình độ tiếng Anh</label>
                    <select
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
                      className="google-input"
                      style={{ appearance: 'auto', paddingRight: '30px' }}
                    >
                      <option value="A1">A1 - Beginner</option>
                      <option value="A2">A2 - Elementary</option>
                      <option value="B1">B1 - Intermediate</option>
                      <option value="B2">B2 - Upper Intermediate</option>
                      <option value="C1">C1 - Advanced</option>
                      <option value="C2">C2 - Proficient</option>
                    </select>
                  </div>
                ) : (
                  <div className="google-field" style={{ marginTop: 16 }}>
                    <label className="google-field-label">Trường học / Tổ chức giảng dạy</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đại học Ngoại Ngữ"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="google-input"
                    />
                  </div>
                )}

                <div className="google-actions" style={{ marginTop: 32 }}>
                  <button type="button" className="google-btn-text" onClick={() => setStep(selectedEmail ? 2 : 1)}>
                    Quay lại
                  </button>
                  <button type="submit" className="google-btn-primary">
                    Hoàn tất đăng ký
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="google-oauth-mock-footer">
          <div className="google-footer-left">
            <span>Tiếng Việt</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_drop_down</span>
          </div>
          <div className="google-footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Trợ giúp</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Bảo mật</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản</a>
          </div>
        </div>
      </div>
    </div>
  )
}
