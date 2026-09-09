import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './LanguageSwitcher.css'

function FlagUK() {
  return (
    <svg viewBox="0 0 60 40" width="18" height="12" className="lang-flag-svg" style={{ borderRadius: 2, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, boxShadow: '0 0 1px rgba(0,0,0,0.3)' }}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v40 M0,20 h60" stroke="#ffffff" strokeWidth="12" />
      <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  )
}

function FlagVN() {
  return (
    <svg viewBox="0 0 60 40" width="18" height="12" className="lang-flag-svg" style={{ borderRadius: 2, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, boxShadow: '0 0 1px rgba(0,0,0,0.3)' }}>
      <rect width="60" height="40" fill="#DA251D" />
      <polygon
        points="30,8 33.7,19.4 45.7,19.4 36,26.4 39.7,37.8 30,30.8 20.3,37.8 24,26.4 14.3,19.4 26.3,19.4"
        fill="#FFFF00"
      />
    </svg>
  )
}

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const languages = [
    { code: 'en', label: 'English', short: 'EN', flagIcon: <FlagUK /> },
    { code: 'vi', label: 'Tiếng Việt', short: 'VI', flagIcon: <FlagVN /> }
  ]

  const currentLang = languages.find(l => l.code === language) || languages[0]

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="lang-switcher" ref={dropdownRef}>
      <button
        type="button"
        className={`lang-switcher__btn ${isOpen ? 'lang-switcher__btn--active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Change Language"
        title={`Current Language: ${currentLang.label}`}
      >
        <span className="lang-switcher__flag">{currentLang.flagIcon}</span>
        <span className="lang-switcher__code">{currentLang.short}</span>
        <span className="material-symbols-outlined lang-switcher__arrow">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="lang-switcher__dropdown animate-scale-up">
          <div className="lang-switcher__header">
            <span>{t('header.language', 'Language')}</span>
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`lang-switcher__item ${l.code === language ? 'lang-switcher__item--selected' : ''}`}
              onClick={() => {
                setLanguage(l.code)
                setIsOpen(false)
              }}
            >
              <span className="lang-switcher__item-flag">{l.flagIcon}</span>
              <span className="lang-switcher__item-label">{l.label}</span>
              {l.code === language && (
                <span className="material-symbols-outlined lang-switcher__check">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
