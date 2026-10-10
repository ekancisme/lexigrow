/**
 * Client-side HTML sanitizer using a strict allowlist.
 * Removes script, iframe, object, embed, event handlers, and javascript: links.
 */
const DANGEROUS_TAGS = /<\s*(?:script|style|iframe|object|embed|applet|meta|link|form|svg|math)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|iframe|object|embed|applet|meta|link|form|svg|math)\s*>|<\s*(?:script|style|iframe|object|embed|applet|meta|link|form|svg|math)[^>]*\/?>/gi
const EVENT_HANDLERS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const JAVASCRIPT_PROTOCOLS = /(?:href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li',
  'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
])

export function sanitizeHtml(raw) {
  if (typeof raw !== 'string' || !raw) return ''

  let clean = raw.replace(DANGEROUS_TAGS, '')
  clean = clean.replace(EVENT_HANDLERS, '')
  clean = clean.replace(JAVASCRIPT_PROTOCOLS, '')

  clean = clean.replace(/<\/?([a-z0-9_-]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const tagLower = tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tagLower)) {
      return ''
    }
    const isClosing = match.startsWith('</')
    if (isClosing) {
      return `</${tagLower}>`
    }
    let safeAttrs = ''
    const classMatch = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    if (classMatch) {
      const cls = (classMatch[1] || classMatch[2] || '').replace(/[^a-zA-Z0-9_\-\s]/g, '')
      if (cls) {
        safeAttrs += ` class="${cls}"`
      }
    }
    const selfClosing = match.endsWith('/>') ? ' /' : ''
    return `<${tagLower}${safeAttrs}${selfClosing}>`
  })

  return clean
}
