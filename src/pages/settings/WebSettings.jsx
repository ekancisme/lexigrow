import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './WebSettings.css'

const NOTIFICATION_OPTIONS = [
  { key: 'email', icon: 'mail', label: 'emailNotifications', description: 'emailNotificationsDesc' },
  { key: 'push', icon: 'notifications_active', label: 'browserNotifications', description: 'browserNotificationsDesc' },
  { key: 'weekly', icon: 'calendar_month', label: 'weeklyDigest', description: 'weeklyDigestDesc' },
]

export default function WebSettings() {
  const { theme, toggleTheme } = useTheme()
  const { t, language, setLanguage } = useLanguage()
  const [notifications, setNotifications] = useState({ email: true, push: true, weekly: false })
  const [loading, setLoading] = useState(true)
  const [savingNotification, setSavingNotification] = useState('')
  const [notificationError, setNotificationError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/profile')
      .then((response) => {
        if (!active) return
        const profile = response?.data?.data || response?.data || response
        if (profile?.notifications) {
          setNotifications({
            email: profile.notifications.email ?? true,
            push: profile.notifications.push ?? true,
            weekly: profile.notifications.weekly ?? false,
          })
        }
      })
      .catch((error) => {
        if (active) setNotificationError(error.message || t('webSettings.loadError'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [t])

  async function toggleNotification(key) {
    const previous = notifications
    const next = { ...previous, [key]: !previous[key] }
    setNotifications(next)
    setSavingNotification(key)
    setNotificationError('')
    try {
      await api.put('/profile/notifications', next)
    } catch (error) {
      setNotifications(previous)
      setNotificationError(error.message || t('webSettings.saveNotificationError'))
    } finally {
      setSavingNotification('')
    }
  }

  async function updatePassword(event) {
    event.preventDefault()
    setPasswordStatus('')
    setPasswordError('')
    setSavingPassword(true)
    try {
      await api.put('/profile/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordStatus(t('webSettings.passwordSuccess'))
    } catch (error) {
      setPasswordError(error.message || t('webSettings.passwordError'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <main className="web-settings-page">
      <header className="web-settings__header">
        <span className="material-symbols-outlined" aria-hidden="true">settings</span>
        <div>
          <h1>{t('webSettings.title')}</h1>
          <p>{t('webSettings.subtitle')}</p>
        </div>
      </header>

      <div className="web-settings__sections">
        <section className="web-settings__card" aria-labelledby="web-preferences-heading">
          <div className="web-settings__card-heading">
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            <div>
              <h2 id="web-preferences-heading">{t('webSettings.preferencesTitle')}</h2>
              <p>{t('webSettings.preferencesDescription')}</p>
            </div>
          </div>
          <div className="web-settings__preference-row">
            <div>
              <strong>{t('webSettings.language')}</strong>
              <p>{t('webSettings.languageDescription')}</p>
            </div>
            <label className="web-settings__select-wrap">
              <span className="sr-only">{t('webSettings.language')}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <div className="web-settings__preference-row">
            <div>
              <strong>{t('webSettings.appearance')}</strong>
              <p>{t('webSettings.appearanceDescription')}</p>
            </div>
            <button type="button" className="web-settings__theme-button" aria-pressed={theme === 'dark'} onClick={toggleTheme}>
              <span className="material-symbols-outlined" aria-hidden="true">{theme === 'light' ? 'light_mode' : 'dark_mode'}</span>
              {theme === 'light' ? t('webSettings.lightMode') : t('webSettings.darkMode')}
            </button>
          </div>
        </section>

        <section className="web-settings__card" aria-labelledby="web-notifications-heading" aria-busy={loading}>
          <div className="web-settings__card-heading">
            <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
            <div>
              <h2 id="web-notifications-heading">{t('webSettings.notificationsTitle')}</h2>
              <p>{t('webSettings.notificationsDescription')}</p>
            </div>
          </div>
          <div className="web-settings__notification-list">
            {NOTIFICATION_OPTIONS.map((option) => (
              <div className="web-settings__notification-row" key={option.key}>
                <span className="material-symbols-outlined" aria-hidden="true">{option.icon}</span>
                <div className="web-settings__notification-copy">
                  <strong>{t(`webSettings.${option.label}`)}</strong>
                  <p>{t(`webSettings.${option.description}`)}</p>
                </div>
                <label className="web-settings__switch">
                  <input
                    type="checkbox"
                    checked={notifications[option.key]}
                    disabled={loading || Boolean(savingNotification)}
                    onChange={() => toggleNotification(option.key)}
                    aria-label={t(`webSettings.${option.label}`)}
                  />
                  <span aria-hidden="true" />
                </label>
              </div>
            ))}
          </div>
          {savingNotification && <p className="web-settings__status" role="status">{t('webSettings.saving')}</p>}
          {notificationError && <p className="web-settings__error" role="alert">{notificationError}</p>}
        </section>

        <section className="web-settings__card" aria-labelledby="web-security-heading">
          <div className="web-settings__card-heading">
            <span className="material-symbols-outlined" aria-hidden="true">shield_lock</span>
            <div>
              <h2 id="web-security-heading">{t('webSettings.securityTitle')}</h2>
              <p>{t('webSettings.securityDescription')}</p>
            </div>
          </div>
          <form className="web-settings__password-form" onSubmit={updatePassword}>
            <div className="web-settings__password-fields">
              <label>
                <span>{t('profileSettings.currentPassword')}</span>
                <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={6} required />
              </label>
              <label>
                <span>{t('profileSettings.newPassword')}</span>
                <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} required />
              </label>
            </div>
            {passwordError && <p className="web-settings__error" role="alert">{passwordError}</p>}
            {passwordStatus && <p className="web-settings__status" role="status">{passwordStatus}</p>}
            <button type="submit" className="web-settings__save-button" disabled={savingPassword}>
              <span className="material-symbols-outlined" aria-hidden="true">{savingPassword ? 'progress_activity' : 'key'}</span>
              {savingPassword ? t('webSettings.saving') : t('profileSettings.updatePassword')}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
