import { describe, it, expect } from 'vitest'
import {
  contextSentence,
  masteredPipeline,
} from '../src/services/wordEvidence.service.js'
import { gardenStage } from '../src/controllers/learningProgress.controller.js'
describe('Evidence and garden rules', () => {
  it('extracts the actual complete sentence for a verified quote', () => {
    const content = 'First sentence. My daily routine is simple. Last sentence.'
    const start = content.indexOf('daily routine')
    expect(contextSentence(content, start, start + 13)).toBe(
      'My daily routine is simple.',
    )
  })
  it.each([
    [0, 'seed'],
    [1, 'sprout'],
    [2, 'sprout'],
    [3, 'leafy'],
    [5, 'leafy'],
    [6, 'blooming'],
  ])('maps %i mastered words to %s', (count, stage) =>
    expect(gardenStage(count)).toBe(stage),
  )
  it('requires correct independent usage, distinct essays AND distinct days', () => {
    const pipeline = JSON.stringify(masteredPipeline('student'))
    expect(pipeline).toContain('"assisted":false')
    expect(pipeline).toContain('"$addToSet":"$essayId"')
    expect(pipeline).toContain('"$addToSet":"$localDay"')
  })
})
