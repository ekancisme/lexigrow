import crypto from 'node:crypto'

/**
 * Computes a deterministic SHA-256 hash of normalized essay text.
 * Strips HTML tags, trims whitespace, and normalizes Unicode NFC.
 *
 * @param {string} content
 * @returns {string}
 */
export function computeContentHash(content) {
  if (!content || typeof content !== 'string') return ''
  const clean = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .normalize('NFC')
  return crypto.createHash('sha256').update(clean).digest('hex')
}
