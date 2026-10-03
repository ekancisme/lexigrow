import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v2'

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest()
}

function encryptionKey() {
  const configured = process.env.AI_PROVIDER_ENCRYPTION_KEY
  if (configured) return deriveKey(configured)
  if (process.env.NODE_ENV === 'test') return deriveKey('lexigrow-test-only-provider-key')
  throw new Error('AI_PROVIDER_ENCRYPTION_KEY is required to encrypt provider secrets')
}

function legacyKeys() {
  return [process.env.AI_PROVIDER_ENCRYPTION_KEY, process.env.JWT_SECRET, 'lexigrow-development-provider-key']
    .filter(Boolean)
    .map(deriveKey)
}

export function encryptSecret(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Provider API key is required')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value.trim(), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.')
}

export function decryptSecret(value) {
  if (typeof value !== 'string') throw new Error('Encrypted provider key is invalid')
  const [version, ivText, tagText, encryptedText] = value.split('.')
  if (!['v1', VERSION].includes(version) || !ivText || !tagText || !encryptedText) throw new Error('Encrypted provider key is invalid')
  const keys = version === VERSION ? [encryptionKey()] : legacyKeys()
  for (const secretKey of keys) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, Buffer.from(ivText, 'base64url'))
      decipher.setAuthTag(Buffer.from(tagText, 'base64url'))
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedText, 'base64url')),
        decipher.final(),
      ]).toString('utf8')
    } catch {
      // Try the next legacy key source when migrating v1 ciphertext.
    }
  }
  throw new Error('Encrypted provider key cannot be decrypted with the configured key')
}

export const isEncryptedSecret = (value) => typeof value === 'string' && /^(v1|v2)\./.test(value)

export function maskSecret(value) {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) return '••••••••'
  return `${text.slice(0, 3)}••••••••${text.slice(-3)}`
}
