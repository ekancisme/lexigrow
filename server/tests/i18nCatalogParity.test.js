import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
} from '../../src/utils/formatters.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

function getLeafKeys(obj, prefix = '') {
  let keys = []
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getLeafKeys(obj[k], full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

describe('i18n Catalog Parity and Localization Tests', () => {
  const enPath = path.join(rootDir, 'src/locales/en.json')
  const viPath = path.join(rootDir, 'src/locales/vi.json')

  const enCatalog = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  const viCatalog = JSON.parse(fs.readFileSync(viPath, 'utf8'))

  const enKeys = new Set(getLeafKeys(enCatalog))
  const viKeys = new Set(getLeafKeys(viCatalog))

  it('maintains 100% key parity between English and Vietnamese catalogs', () => {
    const missingInVi = [...enKeys].filter(k => !viKeys.has(k))
    const missingInEn = [...viKeys].filter(k => !enKeys.has(k))

    expect(missingInVi, `Keys in EN but missing in VI: ${missingInVi.join(', ')}`).toEqual([])
    expect(missingInEn, `Keys in VI but missing in EN: ${missingInEn.join(', ')}`).toEqual([])
    expect(enKeys.size).toBe(viKeys.size)
  })

  it('contains all 26 previously missing audited keys in both catalogs', () => {
    const auditedKeys = [
      'common.words',
      'common.settings',
      'games.fillerCategory',
      'games.fillerSubtitle',
      'games.hunterCategory',
      'games.hunterSubtitle',
      'games.matchingCategory',
      'games.matchingSubtitle',
      'games.scrambleCategory',
      'games.scrambleSubtitle',
      'games.selectPairs',
      'games.selectRounds',
      'games.selectSpeed',
      'games.easy',
      'games.normal',
      'games.hard',
      'games.startHunting',
      'games.vocabSource',
      'quest.crosswordDesc',
      'quest.dailyBadge',
      'quest.dayStatus',
      'progress.essaysCount',
      'progress.totalLearned',
      'goals.acceptRecommendation',
      'vocabLib.reviewAll',
      'pricing.loadingError',
    ]

    for (const key of auditedKeys) {
      expect(enKeys.has(key), `Missing in EN: ${key}`).toBe(true)
      expect(viKeys.has(key), `Missing in VI: ${key}`).toBe(true)
    }
  })

  it('formats dates, times, and currencies consistently according to locale', () => {
    const sampleDate = new Date('2026-10-12T12:00:00Z')

    const viDate = formatDate(sampleDate, 'vi-VN')
    const enDate = formatDate(sampleDate, 'en-US')

    expect(viDate).toBeDefined()
    expect(enDate).toBeDefined()

    const viCurrency = formatCurrency(150000, 'vi-VN', 'VND')
    const enCurrency = formatCurrency(150000, 'en-US', 'VND')

    expect(viCurrency).toContain('150')
    expect(viCurrency).toContain('VND')
    expect(enCurrency).toContain('150')
    expect(enCurrency).toContain('VND')

    const viNum = formatNumber(1234567, 'vi-VN')
    expect(viNum).toBe('1.234.567')

    const enNum = formatNumber(1234567, 'en-US')
    expect(enNum).toBe('1,234,567')
  })
})
