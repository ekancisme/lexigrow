import { useState } from 'react'
import './ProfileSettings.css'

export default function ProfileSettings() {
  const [name, setName] = useState('Prof. Elena Martinez')
  const [email, setEmail] = useState('elena.martinez@university.edu')
  const [institution, setInstitution] = useState('Metropolitan University')
  const [notifications, setNotifications] = useState({ email: true, push: true, weekly: false })

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
            <div className="profile-settings__avatar"><span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-primary)' }}>person</span></div>
            <button className="profile-settings__upload-btn">Change Photo</button>
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
          </div>
          <button className="profile-settings__save-btn" style={{ marginTop: 20 }}>Save Changes</button>
        </section>

        {/* Notifications */}
        <section className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Notification Preferences</h3>
          {[{ key: 'email', label: 'Email Notifications', desc: 'Receive email alerts for student activity' },
            { key: 'push', label: 'Push Notifications', desc: 'Get instant push notifications' },
            { key: 'weekly', label: 'Weekly Digest', desc: 'Receive a weekly summary email' },
          ].map(item => (
            <div key={item.key} className="profile-settings__toggle-row">
              <div>
                <p className="text-label-md" style={{ fontWeight: 700 }}>{item.label}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{item.desc}</p>
              </div>
              <label className="profile-settings__toggle">
                <input type="checkbox" checked={notifications[item.key]} onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })} />
                <span className="profile-settings__toggle-slider" />
              </label>
            </div>
          ))}
        </section>

        {/* Security */}
        <section className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Security</h3>
          <div className="profile-settings__field">
            <label className="text-label-md">Current Password</label>
            <input type="password" className="profile-settings__input" placeholder="••••••••" />
          </div>
          <div className="profile-settings__field">
            <label className="text-label-md">New Password</label>
            <input type="password" className="profile-settings__input" placeholder="••••••••" />
          </div>
          <button className="profile-settings__save-btn" style={{ marginTop: 20 }}>Update Password</button>
        </section>
      </div>
    </div>
  )
}
