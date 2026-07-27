import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useModal } from '../../contexts/ModalContext.jsx'
import './ProfileSettings.css'

export default function ProfileSettings() {
  const { user: authUser } = useAuth()
  const { showAlert, showConfirm } = useModal()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [englishLevel, setEnglishLevel] = useState('B2')
  const [notifications, setNotifications] = useState({ email: true, push: true, weekly: false })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [linkCode, setLinkCode] = useState(null)
  const [generatingLinkCode, setGeneratingLinkCode] = useState(false)
  const [linkCodeSecondsLeft, setLinkCodeSecondsLeft] = useState(0)
  const [linkCodeCopied, setLinkCodeCopied] = useState(false)
  const [guardians, setGuardians] = useState([])
  const [guardiansLoading, setGuardiansLoading] = useState(false)
  const [guardiansError, setGuardiansError] = useState('')
  const [removingGuardianId, setRemovingGuardianId] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/profile')
        const user = res.data
        setName(user.name || '')
        setEmail(user.email || '')
        setInstitution(user.institution || '')
        setEnglishLevel(user.englishLevel || 'B2')
        if (user.notifications) {
          setNotifications({
            email: user.notifications.email ?? true,
            push: user.notifications.push ?? true,
            weekly: user.notifications.weekly ?? false,
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (authUser?.role === 'student') {
      loadGuardians()
    }
  }, [authUser?._id, authUser?.role])

  useEffect(() => {
    if (!linkCode?.expiresAt) return undefined

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((new Date(linkCode.expiresAt).getTime() - Date.now()) / 1000))
      setLinkCodeSecondsLeft(secondsLeft)
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(timer)
  }, [linkCode])

  async function loadGuardians() {
    setGuardiansLoading(true)
    setGuardiansError('')
    try {
      const response = await api.get('/parent/guardians')
      setGuardians(response.data || [])
    } catch (err) {
      setGuardiansError(err.message || 'Could not load linked guardians.')
    } finally {
      setGuardiansLoading(false)
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      await api.put('/profile', {
        name,
        email,
        institution,
        englishLevel,
      })
      alert('Profile updated successfully!')
    } catch (err) {
      alert('Error updating profile: ' + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleToggleNotification(key) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    setSavingNotifs(true)
    try {
      await api.put('/profile/notifications', updated)
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    } finally {
      setSavingNotifs(false)
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      alert('Please fill out both password fields.')
      return
    }
    setUpdatingPassword(true)
    try {
      await api.put('/profile/password', {
        currentPassword,
        newPassword,
      })
      alert('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      alert('Error updating password: ' + err.message)
    } finally {
      setUpdatingPassword(false)
    }
  }

  async function handleGenerateLinkCode() {
    setGeneratingLinkCode(true)
    setLinkCodeCopied(false)
    try {
      const response = await api.post('/parent/link-code')
      if (!response.data?.code || !response.data?.expiresAt) {
        throw new Error('The server returned an invalid link code.')
      }
      setLinkCode(response.data)
    } catch (err) {
      showAlert('Could not generate code', err.message, 'error')
    } finally {
      setGeneratingLinkCode(false)
    }
  }

  async function handleCopyLinkCode() {
    try {
      await navigator.clipboard.writeText(linkCode.code)
      setLinkCodeCopied(true)
      window.setTimeout(() => setLinkCodeCopied(false), 2000)
    } catch {
      showAlert('Could not copy code', 'Please select and copy the code manually.', 'error')
    }
  }

  function handleRemoveGuardian(guardian) {
    showConfirm(
      'Remove guardian access?',
      `${guardian.parent.name} will no longer be able to view your essays, progress, goals, or learning alerts.`,
      async () => {
        setRemovingGuardianId(guardian.linkId)
        try {
          await api.delete(`/parent/guardians/${guardian.linkId}`)
          setGuardians(current => current.filter(item => item.linkId !== guardian.linkId))
          showAlert('Access removed', `${guardian.parent.name} no longer has access to your learning progress.`, 'success')
        } catch (err) {
          showAlert('Could not remove access', err.message, 'error')
        } finally {
          setRemovingGuardianId(null)
        }
      }
    )
  }

  function formatRelationship(relationship) {
    return relationship ? relationship.charAt(0).toUpperCase() + relationship.slice(1) : 'Guardian'
  }

  function formatCountdown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="profile-settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="profile-settings">
      <section className="profile-settings__header">
        <h2 className="text-headline-lg">Profile Settings</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Manage your account and preferences</p>
      </section>

      <div className="profile-settings__layout">
        {authUser?.role === 'student' && (
          <section className="card-base profile-settings__guardians">
            <div className="profile-settings__guardians-header">
              <div>
                <h3 className="text-title-lg">Parents &amp; Guardians</h3>
                <p className="text-body-sm profile-settings__link-code-copy">
                  Manage the people who can view your learning progress.
                </p>
              </div>
              <button
                type="button"
                className="profile-settings__save-btn profile-settings__add-guardian-btn"
                onClick={handleGenerateLinkCode}
                disabled={generatingLinkCode}
              >
                <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
                {generatingLinkCode ? 'Generating...' : linkCode ? 'New code' : 'Add guardian'}
              </button>
            </div>

            {linkCode ? (
              <div className={`profile-settings__link-code-panel ${linkCodeSecondsLeft === 0 ? 'profile-settings__link-code-panel--expired' : ''}`} role="status">
                <div>
                  <p className="text-label-md">One-time guardian code</p>
                  <strong aria-label={`Parent link code ${linkCode.code}`}>{linkCode.code}</strong>
                  <p className="text-label-sm">
                    {linkCodeSecondsLeft > 0 ? `Expires in ${formatCountdown(linkCodeSecondsLeft)}` : 'Code expired'}
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-settings__copy-code-btn"
                  onClick={handleCopyLinkCode}
                  disabled={linkCodeSecondsLeft === 0}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {linkCodeCopied ? 'check' : 'content_copy'}
                  </span>
                  {linkCodeCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : null}

            {linkCode ? (
              <p className="text-label-sm profile-settings__link-code-note">
                Share this code directly with your parent or guardian. Creating a new code invalidates this one.
              </p>
            ) : null}

            <div className="profile-settings__guardian-list" aria-live="polite">
              {guardiansLoading ? (
                <div className="profile-settings__guardians-loading">
                  <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                  Loading linked guardians...
                </div>
              ) : guardiansError ? (
                <div className="profile-settings__guardians-error">
                  <span>{guardiansError}</span>
                  <button type="button" onClick={loadGuardians}>Retry</button>
                </div>
              ) : guardians.length === 0 ? (
                <div className="profile-settings__guardians-empty">
                  <span className="material-symbols-outlined" aria-hidden="true">family_restroom</span>
                  <div>
                    <p className="text-label-md">No guardians linked yet</p>
                    <p className="text-body-sm">Generate a one-time code to invite a parent or guardian.</p>
                  </div>
                </div>
              ) : (
                guardians.map(guardian => (
                  <div className="profile-settings__guardian-row" key={guardian.linkId}>
                    <div className="profile-settings__guardian-avatar" aria-hidden="true">
                      {guardian.parent.avatar ? (
                        <img src={guardian.parent.avatar} alt="" />
                      ) : (
                        <span className="material-symbols-outlined">person</span>
                      )}
                    </div>
                    <div className="profile-settings__guardian-identity">
                      <p className="text-label-md">{guardian.parent.name}</p>
                      <p className="text-body-sm">{guardian.parent.email}</p>
                    </div>
                    <div className="profile-settings__guardian-meta">
                      <span>{formatRelationship(guardian.relationship)}</span>
                      <span>Linked {new Date(guardian.linkedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <button
                      type="button"
                      className="profile-settings__remove-guardian-btn"
                      onClick={() => handleRemoveGuardian(guardian)}
                      disabled={removingGuardianId === guardian.linkId}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">person_remove</span>
                      {removingGuardianId === guardian.linkId ? 'Removing...' : 'Remove access'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Profile Section */}
        <section className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Personal Information</h3>
          <div className="profile-settings__avatar-section">
            <div className="profile-settings__avatar">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-primary)' }}>person</span>
            </div>
          </div>
          <div className="profile-settings__form">
            <div className="profile-settings__field">
              <label className="text-label-md">Full Name</label>
              <input type="text" className="profile-settings__input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="profile-settings__field">
              <label className="text-label-md">Email</label>
              <input type="email" className="profile-settings__input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="profile-settings__field">
              <label className="text-label-md">Institution</label>
              <input type="text" className="profile-settings__input" value={institution} onChange={e => setInstitution(e.target.value)} />
            </div>
            <div className="profile-settings__field">
              <label className="text-label-md">English Level Level</label>
              <select
                className="profile-settings__input"
                value={englishLevel}
                onChange={e => setEnglishLevel(e.target.value)}
                style={{ height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--color-outline)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficient</option>
              </select>
            </div>
          </div>
          <button className="profile-settings__save-btn" onClick={handleSaveProfile} disabled={savingProfile} style={{ marginTop: 20 }}>
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </section>

        {/* Notifications */}
        <section className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Notification Preferences {savingNotifs && '(saving...)'}</h3>
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive email alerts for student activity' },
            { key: 'push', label: 'Push Notifications', desc: 'Get instant push notifications' },
            { key: 'weekly', label: 'Weekly Digest', desc: 'Receive a weekly summary email' },
          ].map(item => (
            <div key={item.key} className="profile-settings__toggle-row">
              <div>
                <p className="text-label-md" style={{ fontWeight: 700 }}>{item.label}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{item.desc}</p>
              </div>
              <label className="profile-settings__toggle">
                <input
                  type="checkbox"
                  checked={notifications[item.key] || false}
                  onChange={() => handleToggleNotification(item.key)}
                />
                <span className="profile-settings__toggle-slider" />
              </label>
            </div>
          ))}
        </section>

        {/* Security */}
        <section className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Security</h3>
          <form onSubmit={handleUpdatePassword}>
            <div className="profile-settings__field">
              <label className="text-label-md">Current Password</label>
              <input
                type="password"
                className="profile-settings__input"
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="profile-settings__field" style={{ marginTop: 12 }}>
              <label className="text-label-md">New Password</label>
              <input
                type="password"
                className="profile-settings__input"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="profile-settings__save-btn" disabled={updatingPassword} style={{ marginTop: 20 }}>
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
