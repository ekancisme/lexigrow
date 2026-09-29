/**
 * Safe cookie parser helper that conforms to RFC 6265
 * and safely ignores malformed URI percent-encoding without throwing.
 *
 * @param {string} cookieHeader - Raw Cookie header string
 * @returns {Record<string, string>} Key-value cookie pairs
 */
export const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {}
  const cookies = {}
  const pairs = cookieHeader.split(';')

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim()
    if (!pair) continue

    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) continue

    const key = pair.slice(0, eqIdx).trim()
    if (!key) continue

    let val = pair.slice(eqIdx + 1).trim()
    // Strip RFC 6265 surrounding quotes if present
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val.slice(1, -1)
    }

    try {
      cookies[key] = decodeURIComponent(val)
    } catch {
      cookies[key] = val
    }
  }

  return cookies
}
