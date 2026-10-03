import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'

function key() {
  const configured = process.env.AI_PROVIDER_ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('AI_PROVIDER_ENCRYPTION_KEY is required in production')
  }
  return crypto.createHash('sha256')
    .update(configured || 'lexigrow-development-provider-key')
    .digest()
}

export function encryptSecret(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Provider API key is required')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key(), iv)
  const encrypted = Buffer.concat([cipher.update(value.trim(), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.')
}

export function decryptSecret(value) {
  if (typeof value !== 'string') throw new Error('Encrypted provider key is invalid')
  const [version, ivText, tagText, encryptedText] = value.split('.')
  if (version !== VERSION || !ivText || !tagText || !encryptedText) throw new Error('Encrypted provider key is invalid')
  const decipher = crypto.createDecipheriv(ALGORITHM, key(), Buffer.from(ivText, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function maskSecret(value) {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) return '••••••••'
  return `${text.slice(0, 3)}••••••••${text.slice(-3)}`
}
