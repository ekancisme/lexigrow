import https from 'node:https'
import net from 'node:net'
import dns from 'node:dns'
import ErrorResponse from './ErrorResponse.js'

export function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b, c] = parts
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    (a >= 224)
}

function ipv6Words(ip) {
  let value = ip.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase()
  if (value.includes('.')) {
    const colon = value.lastIndexOf(':')
    const v4 = value.slice(colon + 1)
    if (!net.isIPv4(v4)) return null
    const [a, b, c, d] = v4.split('.').map(Number)
    value = `${value.slice(0, colon)}:${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = value.split('::')
  if (halves.length > 2) return null
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  if (left.concat(right).some((word) => !/^[0-9a-f]{1,4}$/.test(word))) return null
  const missing = 8 - left.length - right.length
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null
  return [...left, ...Array(missing).fill('0'), ...right].map((word) => Number.parseInt(word, 16))
}

export function isPrivateIPv6(ip) {
  const words = ipv6Words(ip)
  if (!words) return true
  if (words.every((word) => word === 0) || (words.slice(0, 7).every((word) => word === 0) && words[7] === 1)) return true
  if ((words[0] & 0xfe00) === 0xfc00 || (words[0] & 0xffc0) === 0xfe80 ||
      (words[0] & 0xffc0) === 0xfec0 || (words[0] & 0xff00) === 0xff00) return true

  const mapped = words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff
  const compatible = words.slice(0, 6).every((word) => word === 0) && !(words[6] === 0 && words[7] <= 1)
  if (mapped || compatible) {
    const v4 = `${words[6] >> 8}.${words[6] & 255}.${words[7] >> 8}.${words[7] & 255}`
    return isPrivateIPv4(v4)
  }
  return false
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', 'instance-data'])

function parseProviderUrl(urlString, allowTestLoopback) {
  if (!urlString || typeof urlString !== 'string') throw new ErrorResponse('Provider URL is required', 400)
  let parsed
  try {
    parsed = new URL(urlString.trim())
  } catch {
    throw new ErrorResponse('Enter a valid provider URL', 400)
  }
  if (parsed.username || parsed.password) throw new ErrorResponse('Provider URL must not contain credentials', 400)
  const hostname = parsed.hostname.toLowerCase()
  const cleanHost = hostname.replace(/^\[|\]$/g, '')
  if (parsed.protocol !== 'https:') {
    const isLocalTest = allowTestLoopback && ['localhost', '127.0.0.1', '::1'].includes(cleanHost)
    if (!isLocalTest) throw new ErrorResponse('Provider URL must use HTTPS', 400)
  }
  if (BLOCKED_HOSTNAMES.has(cleanHost) || cleanHost.endsWith('.internal') || cleanHost.endsWith('.local')) {
    if (!allowTestLoopback || cleanHost !== 'localhost') {
      throw new ErrorResponse('Access to private or local network hosts is not allowed', 400)
    }
  }
  return { parsed, cleanHost }
}

async function resolveValidatedProviderUrl(urlString, allowTestLoopback = false) {
  const { parsed, cleanHost } = parseProviderUrl(urlString, allowTestLoopback)
  let addresses
  if (net.isIPv4(cleanHost)) addresses = [{ address: cleanHost, family: 4 }]
  else if (net.isIPv6(cleanHost)) addresses = [{ address: cleanHost, family: 6 }]
  else {
    try {
      addresses = await dns.promises.lookup(cleanHost, { all: true, verbatim: true })
    } catch (error) {
      throw new ErrorResponse(`Provider hostname resolution failed: ${error.message}`, 400)
    }
  }
  if (!addresses?.length) throw new ErrorResponse('Provider host could not be resolved', 400)
  for (const { address } of addresses) {
    const blocked = net.isIPv4(address) ? isPrivateIPv4(address) : net.isIPv6(address) ? isPrivateIPv6(address) : true
    if (blocked && (!allowTestLoopback || !['127.0.0.1', '::1'].includes(address))) {
      throw new ErrorResponse('Provider host resolves to a private, loopback, or reserved IP address', 400)
    }
  }
  return { parsed, cleanHost, addresses }
}

export async function validateSafeUrl(urlString, allowTestLoopback = false) {
  const { parsed } = await resolveValidatedProviderUrl(urlString, allowTestLoopback)
  return parsed
}

/** Performs HTTPS using the exact DNS addresses validated immediately beforehand. */
export async function fetchSafeUrl(urlString, { method = 'GET', headers = {}, body, signal, timeoutMs = 30000, maxResponseBytes = 5 * 1024 * 1024 } = {}) {
  const { parsed, cleanHost, addresses } = await resolveValidatedProviderUrl(urlString)
  const pinnedLookup = (_hostname, options, callback) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    const family = Number(options?.family) || 0
    const safeAddresses = addresses
      .map(({ address, family: addressFamily }) => ({ address, family: addressFamily }))
      .filter((item) => !family || item.family === family)
    if (!safeAddresses.length) return callback(new Error('No validated provider address matches the requested address family'))
    if (options?.all) callback(null, safeAddresses)
    else callback(null, safeAddresses[0].address, safeAddresses[0].family)
  }
  const requestHeaders = { ...headers }
  if (body !== undefined && body !== null && !Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-length')) {
    requestHeaders['Content-Length'] = Buffer.byteLength(body)
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', abortRequest)
      if (error) reject(error)
      else resolve(value)
    }
    const request = https.request(parsed, {
      method,
      headers: requestHeaders,
      lookup: pinnedLookup,
      ...(net.isIP(cleanHost) ? {} : { servername: cleanHost }),
    }, (response) => {
      const chunks = []
      let size = 0
      response.on('data', (chunk) => {
        size += chunk.length
        if (size > maxResponseBytes) {
          request.destroy(new Error('Provider response exceeded the allowed size'))
          return
        }
        chunks.push(chunk)
      })
      response.on('error', (error) => finish(error))
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        finish(null, {
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          headers: { get: (name) => response.headers[String(name).toLowerCase()] || null },
          text: async () => text,
          json: async () => JSON.parse(text),
          body: null,
        })
      })
    })
    const abortRequest = () => request.destroy(signal?.reason instanceof Error ? signal.reason : new Error('Provider request aborted'))
    const timer = setTimeout(() => request.destroy(Object.assign(new Error('Provider request timed out'), { code: 'ETIMEDOUT' })), timeoutMs)
    request.on('error', (error) => finish(error))
    if (signal?.aborted) abortRequest()
    else signal?.addEventListener('abort', abortRequest, { once: true })
    if (body !== undefined && body !== null) request.write(body)
    request.end()
  })
}
