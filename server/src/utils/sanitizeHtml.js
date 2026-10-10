import sanitizeHtmlParser from 'sanitize-html'

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li',
  'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
]

export function sanitizeHtml(raw) {
  if (typeof raw !== 'string' || !raw) return ''
  return sanitizeHtmlParser(raw, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { '*': ['class'] },
    allowedClasses: { '*': [/^[a-zA-Z0-9_\-\s]+$/] },
    allowedSchemes: [],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
  })
}
