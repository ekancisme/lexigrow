import { describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import AIModelCombo from '../src/models/AIModelCombo.js'

describe('AI model combo policy', () => {
  it('stores ordered candidates and bounded request policy', () => {
    const combo = new AIModelCombo({
      name: 'Writing Combo',
      routes: ['essay_analysis', 'learning_path'],
      candidates: [
        { model: new mongoose.Types.ObjectId(), order: 1 },
        { model: new mongoose.Types.ObjectId(), order: 2 },
      ],
      maxAttempts: 2,
      timeoutMs: 20000,
      active: true,
    })
    expect(combo.validateSync()).toBeUndefined()
    expect(combo.candidates.map((item) => item.order)).toEqual([1, 2])
  })

  it('rejects an empty combo name', () => {
    const combo = new AIModelCombo({ candidates: [{ model: new mongoose.Types.ObjectId(), order: 1 }] })
    expect(combo.validateSync()?.errors?.name).toBeTruthy()
  })
})
