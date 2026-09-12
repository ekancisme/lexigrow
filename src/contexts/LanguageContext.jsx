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


  const t = useCallback((path, fallback = '', params = {}) => {
    if (!path) return fallback
    let actualFallback = fallback
    let actualParams = params

    if (typeof fallback === 'object' && fallback !== null) {
      actualParams = fallback
      actualFallback = path
    }

    const keys = path.split('.')
    let current = translations[language] || translations.en
    let found = true
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        found = false
        break
      }
    }

    if (!found || typeof current !== 'string') {
      // Fallback to English if key missing in current language
      let fbVal = translations.en
      let fbFound = true
      for (const fbKey of keys) {
        if (fbVal && typeof fbVal === 'object' && fbKey in fbVal) {
          fbVal = fbVal[fbKey]
        } else {
          fbFound = false
          break
        }
      }
      current = (fbFound && typeof fbVal === 'string') ? fbVal : (actualFallback || path)
    }

    let result = typeof current === 'string' ? current : (actualFallback || path)

    // Interpolate {param} placeholders
    if (actualParams && typeof actualParams === 'object') {
      Object.keys(actualParams).forEach((pKey) => {
        result = result.replaceAll(`{${pKey}}`, String(actualParams[pKey]))
      })
    }

    return result
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
