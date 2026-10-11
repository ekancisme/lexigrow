import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './AnnouncementPopup.css'

export default function AnnouncementPopup({ role }) {
  const { language, t } = useLanguage()
  const [items, setItems] = useState([])
  const [hidden, setHidden] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef(null)
  useEffect(() => {
    let active = true
    api.get('/announcements/active').then(({ data }) => {
      if (active) setItems(data?.data || [])
    }).catch(() => {})
    return () => { active = false }
  }, [role])
  const announcement = useMemo(() => items.find(item => !hidden.has(item._id)), [items, hidden])
  useEffect(() => {
    if (!announcement) return undefined
    const previousFocus = document.activeElement
    dialogRef.current?.querySelector('button')?.focus()
    const onKey = event => {
      if (event.key === 'Escape' && !busy) setHidden(prev => new Set(prev).add(announcement._id))
      if (event.key === 'Tab') {
        const controls = [...(dialogRef.current?.querySelectorAll('button:not(:disabled),a[href]') || [])]
        if (!controls.length) return
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previousFocus?.focus?.() }
  }, [announcement, busy])
  if (!announcement) return null
  const title = language === 'vi' ? announcement.titleVi : announcement.titleEn
  const body = language === 'vi' ? announcement.bodyVi : announcement.bodyEn
  const alt = language === 'vi' ? announcement.imageAltVi : announcement.imageAltEn
  const actionLabel = language === 'vi' ? announcement.actionLabelVi : announcement.actionLabelEn
  const dismiss = () => setHidden(prev => new Set(prev).add(announcement._id))
  const suppress = async () => {
    setBusy(true)
    try {
      await api.post(`/announcements/${announcement._id}/suppress-24h`, {})
      dismiss()
    } catch {
      setBusy(false)
      return
    }
    setBusy(false)
  }
  return <div className="announcement-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) dismiss() }}>
    <section ref={dialogRef} className="announcement-dialog" role="dialog" aria-modal="true" aria-labelledby="announcement-title" aria-describedby="announcement-body">
      <button type="button" className="announcement-dialog__close-icon" aria-label={t('announcements.close', 'Close announcement')} onClick={dismiss}>×</button>
      {announcement.bannerUrl && <img className="announcement-dialog__banner" src={announcement.bannerUrl} alt="" />}
      {announcement.imageUrl && <img className="announcement-dialog__image" src={announcement.imageUrl} alt={alt || title} />}
      <div className="announcement-dialog__content"><h2 id="announcement-title">{title}</h2><p id="announcement-body">{body}</p>
        <div className="announcement-dialog__actions">
          {announcement.actionUrl && <Link className="announcement-dialog__primary" to={announcement.actionUrl} onClick={dismiss}>{actionLabel}</Link>}
          <button type="button" className="announcement-dialog__secondary" onClick={dismiss}>{t('announcements.close', 'Close')}</button>
          <button type="button" className="announcement-dialog__quiet" disabled={busy} onClick={suppress}>{busy ? t('common.loading', 'Loading...') : t('announcements.suppress24h', "Don't show again for 24 hours")}</button>
        </div>
      </div>
    </section>
  </div>
}
