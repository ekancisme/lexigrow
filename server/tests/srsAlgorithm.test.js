import { describe, it, expect } from 'vitest'
import { calculateSM2 } from '../src/services/srs.service.js'
import { dayKey, dayBoundary } from '../src/utils/learning.js'
describe('SRS calendar and state', () => {
  it('schedules local tomorrow in Vietnam, independent of server timezone', () => {
    const next = calculateSM2({}, 3, { now: new Date('2026-09-08T18:00:00Z'), timezone: 'Asia/Ho_Chi_Minh' })
    expect(next.nextReviewDate.toISOString()).toBe('2026-09-09T17:00:00.000Z')
  })
  it('handles a 23-hour DST day', () => {
    const now = new Date('2026-03-08T06:00:00Z')
    expect(dayBoundary(now, 1, 'America/New_York').toISOString()).toBe('2026-03-09T04:00:00.000Z')
    expect(dayKey(now, 'America/New_York')).toBe('2026-03-08')
  })
  it('rejects corrupted SRS state', () => {
    expect(() => calculateSM2({ reviewInterval: -1 }, 3)).toThrow()
  })
  it('retains first and second review milestones and resets forgotten words', () => {
    const one = calculateSM2({}, 3)
    const two = calculateSM2(one, 3)
    expect([one.reviewInterval, two.reviewInterval]).toEqual([1, 6])
    expect(calculateSM2(two, 1).reviewCount).toBe(0)
  })
})

