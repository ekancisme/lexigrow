import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret, maskSecret } from '../src/utils/secretCrypto.js'

describe('provider secret storage', () => {
  it('encrypts and decrypts without storing plaintext', () => {
    const encrypted = encryptSecret('gsk_sensitive_provider_key')
    expect(encrypted).not.toContain('gsk_sensitive_provider_key')
    expect(decryptSecret(encrypted)).toBe('gsk_sensitive_provider_key')
  })

  it('masks keys without exposing the middle', () => {
    expect(maskSecret('gsk_sensitive_provider_key')).toMatch(/^gsk••••••••key$/)
    expect(maskSecret('short')).toBe('••••••••')
  })
})
