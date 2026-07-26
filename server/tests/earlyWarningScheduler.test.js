import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  schedule: vi.fn(),
  validate: vi.fn(),
  runEarlyWarningScan: vi.fn(),
}))

vi.mock('node-cron', () => ({
  default: {
    schedule: mocks.schedule,
    validate: mocks.validate,
  },
}))

vi.mock('../src/services/earlyWarning.service.js', () => ({
  runEarlyWarningScan: mocks.runEarlyWarningScan,
}))

import {
  DEFAULT_EARLY_WARNING_CRON,
  DEFAULT_EARLY_WARNING_TIMEZONE,
  scheduleEarlyWarningScan,
} from '../src/services/earlyWarning.scheduler.js'

describe('weekly early warning scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete globalThis.process.env.EARLY_WARNING_CRON
    delete globalThis.process.env.EARLY_WARNING_TIMEZONE
    mocks.validate.mockReturnValue(true)
    mocks.schedule.mockReturnValue({ stop: vi.fn() })
    mocks.runEarlyWarningScan.mockResolvedValue({ scanned: 2, created: 1 })
  })

  it('registers a non-overlapping Monday schedule without running immediately', async () => {
    const task = scheduleEarlyWarningScan()

    expect(task).toBeTruthy()
    expect(mocks.validate).toHaveBeenCalledWith(DEFAULT_EARLY_WARNING_CRON)
    expect(mocks.schedule).toHaveBeenCalledWith(
      DEFAULT_EARLY_WARNING_CRON,
      expect.any(Function),
      expect.objectContaining({
        timezone: DEFAULT_EARLY_WARNING_TIMEZONE,
        noOverlap: true,
      })
    )
    expect(mocks.runEarlyWarningScan).not.toHaveBeenCalled()

    const scheduledCallback = mocks.schedule.mock.calls[0][1]
    await scheduledCallback()
    expect(mocks.runEarlyWarningScan).toHaveBeenCalledTimes(1)
  })

  it('rejects an invalid cron expression', () => {
    globalThis.process.env.EARLY_WARNING_CRON = 'not-a-cron'
    mocks.validate.mockReturnValue(false)

    expect(() => scheduleEarlyWarningScan()).toThrow('Invalid EARLY_WARNING_CRON expression')
    expect(mocks.schedule).not.toHaveBeenCalled()
  })
})