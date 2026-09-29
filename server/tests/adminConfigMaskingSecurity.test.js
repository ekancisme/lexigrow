import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const { mockConfigs } = vi.hoisted(() => ({
  mockConfigs: [
    {
      key: 'GROQ_API_KEY',
      value: 'gsk_abcdef1234567890ghijklmn',
      description: 'Groq Cloud API Key',
    },
    {
      key: 'SHORT_TOKEN',
      value: 'tiny_key_88',
      description: 'A short 11-char token',
    },
    {
      key: 'JWT_SECRET',
      value: 'super_secret_jwt_signature_key',
      description: 'JWT Signing Secret',
    },
    {
      key: 'PAYOS_CHECKSUM',
      value: 'checksum_secret_hash_value',
      description: 'Payment Checksum Secret',
    },
    {
      key: 'SMTP_PASSWORD',
      value: 'smtp_pass_1234',
      description: 'Email password',
    },
    {
      key: 'DEFAULT_AI_MODEL',
      value: 'llama-3.3-70b-versatile',
      description: 'Default LLM Model Name',
    },
    {
      key: 'ALLOW_PASTE_ESSAY',
      value: 'true',
      description: 'Allow copy-pasting',
    },
  ],
}))

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

vi.mock('../src/models/Config.js', () => {
  return {
    default: {
      find: vi.fn().mockResolvedValue(mockConfigs),
      findOne: vi.fn().mockImplementation(({ key }) => {
        const found = mockConfigs.find((c) => c.key === key)
        if (!found) return Promise.resolve(null)
        return Promise.resolve({
          ...found,
          save: vi.fn().mockResolvedValue(true),
        })
      }),
    },
  }
})

vi.mock('../src/models/AuditLog.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({ _id: 'mock_audit_id' }),
  },
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439011', role: 'admin' }
    next()
  },
  authorize: () => (req, res, next) => next(),
}))

import app from '../src/index.js'
import Config from '../src/models/Config.js'

describe('Admin Configuration Secret Masking Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/admin/config properly masks secrets across different lengths and key patterns', async () => {
    const res = await request(app).get('/api/admin/config').expect(200)

    expect(res.body.success).toBe(true)
    const data = res.body.data

    // 1. Long key GROQ_API_KEY
    const groq = data.find((c) => c.key === 'GROQ_API_KEY')
    expect(groq.isSecret).toBe(true)
    expect(groq.value).toContain('••••••••')
    expect(groq.value).not.toBe('gsk_abcdef1234567890ghijklmn')
    expect(groq.value.startsWith('gsk')).toBe(true)
    expect(groq.value.endsWith('lmn')).toBe(true)

    // 2. Short secret SHORT_TOKEN (length <= 12) -> strictly fixed mask
    const shortToken = data.find((c) => c.key === 'SHORT_TOKEN')
    expect(shortToken.isSecret).toBe(true)
    expect(shortToken.value).toBe('••••••••')
    expect(shortToken.value).not.toContain('tiny')
    expect(shortToken.value).not.toContain('88')

    // 3. JWT_SECRET (non _API_KEY suffix) -> recognized and masked
    const jwtSecret = data.find((c) => c.key === 'JWT_SECRET')
    expect(jwtSecret.isSecret).toBe(true)
    expect(jwtSecret.value).toContain('••••••••')
    expect(jwtSecret.value).not.toBe('super_secret_jwt_signature_key')

    // 4. PAYOS_CHECKSUM -> recognized and masked
    const checksum = data.find((c) => c.key === 'PAYOS_CHECKSUM')
    expect(checksum.isSecret).toBe(true)
    expect(checksum.value).toContain('••••••••')

    // 5. SMTP_PASSWORD -> recognized and masked
    const password = data.find((c) => c.key === 'SMTP_PASSWORD')
    expect(password.isSecret).toBe(true)
    expect(password.value).toContain('••••••••')

    // 6. Non-sensitive settings -> unmasked
    const model = data.find((c) => c.key === 'DEFAULT_AI_MODEL')
    expect(model.isSecret).toBe(false)
    expect(model.value).toBe('llama-3.3-70b-versatile')

    const paste = data.find((c) => c.key === 'ALLOW_PASTE_ESSAY')
    expect(paste.isSecret).toBe(false)
    expect(paste.value).toBe('true')
  })

  it('PUT /api/admin/config preserves secret value when masked string is sent', async () => {
    const saveMock = vi.fn().mockResolvedValue(true)
    const mockDbConfig = {
      key: 'GROQ_API_KEY',
      value: 'gsk_real_secret_groq_key_in_database',
      save: saveMock,
    }
    Config.findOne.mockResolvedValue(mockDbConfig)

    const res = await request(app)
      .put('/api/admin/config')
      .send({
        settings: [
          { key: 'GROQ_API_KEY', value: 'gsk••••••••base' },
        ],
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    // Secret was not overwritten by mask
    expect(mockDbConfig.value).toBe('gsk_real_secret_groq_key_in_database')
    expect(saveMock).not.toHaveBeenCalled()
  })

  it('PUT /api/admin/config returns masked value in response when secret is updated', async () => {
    const saveMock = vi.fn().mockResolvedValue(true)
    const mockDbConfig = {
      key: 'GROQ_API_KEY',
      value: 'gsk_old_secret_value_1234567890',
      save: saveMock,
    }
    Config.findOne.mockResolvedValue(mockDbConfig)

    const res = await request(app)
      .put('/api/admin/config')
      .send({
        settings: [
          { key: 'GROQ_API_KEY', value: 'gsk_new_secret_updated_value_987654' },
        ],
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data[0].key).toBe('GROQ_API_KEY')
    expect(res.body.data[0].value).toMatch(/gsk••••••••\w+/)
    expect(res.body.data[0].value).not.toContain('updated_value')
  })
})
