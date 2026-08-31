import { describe, it, expect } from 'vitest'
import { calculateSM2 } from '../src/services/srs.service.js'

describe('calculateSM2 — SM-2 Spaced Repetition Algorithm', () => {
  // ─── Input validation ───────────────────────────────────────────────────────

  it('throws on invalid rating 0', () => {
    expect(() => calculateSM2({}, 0)).toThrow('Rating must be 1')
  })

  it('throws on invalid rating 5', () => {
    expect(() => calculateSM2({}, 5)).toThrow('Rating must be 1')
  })

  it('throws on string rating', () => {
    expect(() => calculateSM2({}, '3')).toThrow('Rating must be 1')
  })

  // ─── Rating 1 (Again) — total failure ───────────────────────────────────────

  describe('rating 1 (Again)', () => {
    it('resets reviewCount to 0', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 3 }, 1)
      expect(result.reviewCount).toBe(0)
    })

    it('sets interval to 1 day', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 3 }, 1)
      expect(result.reviewInterval).toBe(1)
    })

    it('decreases easeFactor', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 1)
      expect(result.easeFactor).toBeLessThan(2.5)
    })

    it('sets masteryLevel to new', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 1)
      expect(result.masteryLevel).toBe('new')
    })
  })

  // ─── Rating 2 (Hard) — incorrect but recalled ───────────────────────────────

  describe('rating 2 (Hard)', () => {
    it('resets reviewCount to 0', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 2 }, 2)
      expect(result.reviewCount).toBe(0)
    })

    it('sets interval to 1 day', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 2 }, 2)
      expect(result.reviewInterval).toBe(1)
    })

    it('sets masteryLevel to new', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 2)
      expect(result.masteryLevel).toBe('new')
    })
  })

  // ─── Rating 3 (Good) — correct recall ───────────────────────────────────────

  describe('rating 3 (Good)', () => {
    it('first success: interval = 1, reviewCount = 1, masteryLevel = learning', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 3)
      expect(result.reviewCount).toBe(1)
      expect(result.reviewInterval).toBe(1)
      expect(result.masteryLevel).toBe('learning')
    })

    it('second success: interval = 6, reviewCount = 2', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 1 }, 3)
      expect(result.reviewCount).toBe(2)
      expect(result.reviewInterval).toBe(6)
    })

    it('third success: interval = round(prevInterval × EF)', () => {
      // prevInterval=6, EF=2.5, q=4 → newEF = 2.5 + 0.1 - 1*(0.08+0.02) = 2.5
      // interval = round(6 × 2.5) = 15
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 2 }, 3)
      expect(result.reviewCount).toBe(3)
      expect(result.reviewInterval).toBe(15)
    })

    it('increments EF on success (q=4)', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 3)
      // EF' = 2.5 + 0.1 - (5-4)*(0.08+(5-4)*0.02) = 2.5 + 0.1 - 0.1 = 2.5
      expect(result.easeFactor).toBeCloseTo(2.5, 2)
    })
  })

  // ─── Rating 4 (Easy) — perfect recall ───────────────────────────────────────

  describe('rating 4 (Easy)', () => {
    it('applies ×1.3 bonus to interval on first success', () => {
      // reviewCount=0 → newReviewCount=1 → base interval=1 → ×1.3 → round(1.3) = 1
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 4)
      expect(result.reviewInterval).toBe(1) // round(1 × 1.3) = 1
    })

    it('applies ×1.3 bonus to interval on second success', () => {
      // reviewCount=1 → newReviewCount=2 → base interval=6 → ×1.3 → round(7.8) = 8
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 1 }, 4)
      expect(result.reviewInterval).toBe(8)
    })

    it('applies ×1.3 bonus on third+ success', () => {
      // EF after rating 4: 2.5 + 0.1 - (5-5)*(0.08+(5-5)*0.02) = 2.6
      // base interval = round(6 * 2.6) = 16, then ×1.3 → round(20.8) = 21
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 2 }, 4)
      expect(result.reviewInterval).toBe(21)
    })

    it('increases EF more than rating 3 does', () => {
      const r3 = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 3)
      const r4 = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 4)
      expect(r4.easeFactor).toBeGreaterThanOrEqual(r3.easeFactor)
    })
  })

  // ─── EF floor ───────────────────────────────────────────────────────────────

  describe('EF floor clamping', () => {
    it('EF never drops below 1.3 after repeated rating 1', () => {
      let state = { easeFactor: 1.4, reviewInterval: 1, reviewCount: 0 }
      for (let i = 0; i < 10; i++) {
        state = calculateSM2(state, 1)
      }
      expect(state.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it('EF at minimum 1.3 stays at 1.3 with rating 1', () => {
      const result = calculateSM2({ easeFactor: 1.3, reviewInterval: 1, reviewCount: 0 }, 1)
      expect(result.easeFactor).toBe(1.3)
    })
  })

  // ─── masteryLevel transitions ────────────────────────────────────────────────

  describe('masteryLevel', () => {
    it('"new" when reviewCount = 0 (failed review)', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 6, reviewCount: 5 }, 1)
      expect(result.masteryLevel).toBe('new')
    })

    it('"learning" when reviewCount 1–3 and EF >= 2.0', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 2 }, 3)
      expect(result.masteryLevel).toBe('learning')
    })

    it('"learning" when reviewCount >= 4 but EF < 2.0', () => {
      const result = calculateSM2({ easeFactor: 1.5, reviewInterval: 10, reviewCount: 4 }, 3)
      expect(result.masteryLevel).toBe('learning')
    })

    it('"mastered" when reviewCount >= 4 and EF >= 2.0', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 10, reviewCount: 4 }, 3)
      expect(result.masteryLevel).toBe('mastered')
    })
  })

  // ─── nextReviewDate ──────────────────────────────────────────────────────────

  describe('nextReviewDate', () => {
    it('is normalized to midnight (00:00:00.000)', () => {
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 3)
      const d = result.nextReviewDate
      expect(d.getHours()).toBe(0)
      expect(d.getMinutes()).toBe(0)
      expect(d.getSeconds()).toBe(0)
      expect(d.getMilliseconds()).toBe(0)
    })

    it('is in the future (at least 1 day from now)', () => {
      const before = new Date()
      before.setHours(23, 59, 59, 999)
      const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 3)
      expect(result.nextReviewDate.getTime()).toBeGreaterThan(before.setHours(0, 0, 0, 0))
    })

    it('returns a Date instance', () => {
      const result = calculateSM2({}, 3)
      expect(result.nextReviewDate).toBeInstanceOf(Date)
    })
  })

  // ─── easeFactor precision ────────────────────────────────────────────────────

  it('rounds easeFactor to 3 decimal places', () => {
    const result = calculateSM2({ easeFactor: 2.5, reviewInterval: 1, reviewCount: 0 }, 2)
    const decimals = result.easeFactor.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(3)
  })

  // ─── Default values ──────────────────────────────────────────────────────────

  it('works with empty current state (uses SM-2 defaults)', () => {
    expect(() => calculateSM2({}, 3)).not.toThrow()
    const result = calculateSM2({}, 3)
    expect(result.reviewCount).toBe(1)
    expect(result.reviewInterval).toBe(1)
  })
})
