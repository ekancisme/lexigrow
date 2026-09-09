import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../locales/en.json'
import vi from '../locales/vi.json'

const translations = { en, vi }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('lexigrow_language') || 'en'
  })

  const setLanguage = useCallback((lang) => {
    if (lang === 'en' || lang === 'vi') {
      setLanguageState(lang)
      localStorage.setItem('lexigrow_language', lang)
      document.documentElement.lang = lang
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'vi' : 'en')
  }, [language, setLanguage])


  useEffect(() => {
    document.documentElement.lang = language
  }, [language])


  const t = useCallback((path, fallback = '') => {
    if (!path) return fallback
    const keys = path.split('.')
    let current = translations[language] || translations.en
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Fallback to English if key missing
        let fbVal = translations.en
        for (const fbKey of keys) {
          if (fbVal && typeof fbVal === 'object' && fbKey in fbVal) {
            fbVal = fbVal[fbKey]
          } else {
            return fallback || path
          }
        }
        return fbVal || fallback || path
      }
    }

    return typeof current === 'string' ? current : (fallback || path)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
