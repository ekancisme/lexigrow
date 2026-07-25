import cron from 'node-cron'
import { runEarlyWarningScan } from './earlyWarning.service.js'

export const DEFAULT_EARLY_WARNING_CRON = '0 8 * * 1'
export const DEFAULT_EARLY_WARNING_TIMEZONE = 'Asia/Ho_Chi_Minh'

export const scheduleEarlyWarningScan = () => {
  const expression = globalThis.process.env.EARLY_WARNING_CRON || DEFAULT_EARLY_WARNING_CRON
  const timezone = globalThis.process.env.EARLY_WARNING_TIMEZONE || DEFAULT_EARLY_WARNING_TIMEZONE

  if (!cron.validate(expression)) {
    throw new Error(`Invalid EARLY_WARNING_CRON expression: ${expression}`)
  }

  const task = cron.schedule(expression, async () => {
    try {
      const summary = await runEarlyWarningScan()
      console.log('[EarlyWarning] Weekly scan summary:', summary)
    } catch (error) {
      console.error('[EarlyWarning] Weekly scan failed:', error)
    }
  }, {
    timezone,
    noOverlap: true,
    name: 'weekly-early-warning-scan',
  })

  console.log(`[EarlyWarning] Scheduled weekly scan (${expression}, ${timezone})`)
  return task
}