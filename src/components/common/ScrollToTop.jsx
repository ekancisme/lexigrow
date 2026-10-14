import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 * Ensures that upon route change or navigation, the page is ALWAYS
 * smoothly & immediately reset to the top (0, 0), preventing views
 * from loading scrolled down or at the bottom.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // 1. Disable browser automatic scroll restoration
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // 2. Immediate scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0

    // 3. Reset any layout scroll containers if present
    const mainContent = document.querySelector('.app-layout__content') ||
      document.querySelector('.app-layout__main') ||
      document.querySelector('main')
    if (mainContent) {
      mainContent.scrollTop = 0
    }

    // 4. Double check on next requestAnimationFrame to handle post-render DOM/chunk shifts
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    })

    return () => cancelAnimationFrame(raf)
  }, [pathname, search])

  return null
}
