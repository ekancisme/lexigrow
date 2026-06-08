import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './ProfileSettings.css'

export default function ProfileSettings() {
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
