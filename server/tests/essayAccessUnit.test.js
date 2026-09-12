import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/models/Class.js', () => ({
  default: { exists: vi.fn() },
}))
vi.mock('../src/models/Essay.js', () => ({
  default: { findById: vi.fn() },
}))

import Class from '../src/models/Class.js'
import { canAccessEssay, canAccessChatRoom } from '../src/utils/essayAccess.js'

describe('canAccessEssay', () => {
  it('grants admins unconditionally', async () => {
    expect(await canAccessEssay({ _id: 'a', role: 'admin' }, { student: 's1' })).toBe(true)
  })

  it('only grants students their own essay', async () => {
    expect(await canAccessEssay({ _id: 's1', role: 'student' }, { student: 's1' })).toBe(true)
    expect(await canAccessEssay({ _id: 's2', role: 'student' }, { student: 's1' })).toBe(false)
  })

  it('grants teachers only for an active class containing the student', async () => {
    Class.exists.mockResolvedValueOnce(true)
    expect(await canAccessEssay({ _id: 't1', role: 'teacher' }, { student: 's1' })).toBe(true)
    Class.exists.mockResolvedValueOnce(false)
    expect(await canAccessEssay({ _id: 't2', role: 'teacher' }, { student: 's1' })).toBe(false)
  })

  it('grants parents only for their own children', async () => {
    expect(
      await canAccessEssay({ _id: 'p1', role: 'parent', children: ['s1'] }, { student: 's1' })
    ).toBe(true)
    expect(
      await canAccessEssay({ _id: 'p1', role: 'parent', children: ['s9'] }, { student: 's1' })
    ).toBe(false)
  })
})

describe('canAccessChatRoom', () => {
  it('allows any authenticated user into the support room', async () => {
    expect(await canAccessChatRoom({ _id: 'u1', role: 'student' }, 'support')).toBe(true)
  })

  it('allows a user into their own user room only', async () => {
    expect(await canAccessChatRoom({ _id: 'u1', role: 'student' }, 'user:u1')).toBe(true)
    expect(await canAccessChatRoom({ _id: 'u1', role: 'student' }, 'user:u2')).toBe(false)
  })
})