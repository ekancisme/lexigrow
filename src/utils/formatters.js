/**
 * Centralized formatting utilities for LexiGrow.
 * Automatically aligns with active language ('en' | 'vi').
 */

export function getLocale(language = 'en') {
  if (typeof language === 'string' && language.toLowerCase().startsWith('vi')) {
    return 'vi-VN'
  }
  return 'en-US'
}

/**
 * Format date based on active language
 */
export function formatDate(date, language = 'en', options) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const locale = getLocale(language)
  const defaultOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  return d.toLocaleDateString(locale, defaultOptions)
}

/**
 * Format time based on active language
 */
export function formatTime(date, language = 'en', options) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const locale = getLocale(language)
  const defaultOptions = options || {
    hour: '2-digit',
    minute: '2-digit'
  }
  return d.toLocaleTimeString(locale, defaultOptions)
}

/**
 * Format date and time together
 */
export function formatDateTime(date, language = 'en', options) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const locale = getLocale(language)
  return d.toLocaleString(locale, options)
}

/**
 * Format relative time (e.g. "Just now", "5m ago" / "Vừa xong", "5 phút trước")
 */
export function formatRelativeTime(date, language = 'en') {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = Date.now()
  const diffMs = now - d.getTime()
  const isVi = language === 'vi'

  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return isVi ? 'Vừa xong' : 'Just now'
  if (diffMin < 60) return isVi ? `${diffMin} phút trước` : `${diffMin}m ago`
  if (diffHr < 24) return isVi ? `${diffHr} giờ trước` : `${diffHr}h ago`
  if (diffDay < 7) return isVi ? `${diffDay} ngày trước` : `${diffDay}d ago`

  return formatDate(d, language)
}

/**
 * Format number with thousand separators
 */
export function formatNumber(number, language = 'en', options) {
  if (number === null || number === undefined || isNaN(number)) return '0'
  const locale = getLocale(language)
  return Number(number).toLocaleString(locale, options)
}

/**
 * Format currency amount
 */
export function formatCurrency(amount, language = 'en', currency = 'VND') {
  if (amount === null || amount === undefined || isNaN(amount)) return `0 ${currency}`
  const locale = getLocale(language)
  return `${Number(amount).toLocaleString(locale)} ${currency}`
}
