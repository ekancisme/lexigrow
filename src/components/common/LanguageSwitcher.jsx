import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const languages = [
    { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
    { code: 'vi', label: 'Tiếng Việt', short: 'VI', flag: '🇻🇳' }
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
        <span className="lang-switcher__flag">{currentLang.flag}</span>
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
              <span className="lang-switcher__item-flag">{l.flag}</span>
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
