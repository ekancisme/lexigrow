import { describe, expect, it } from 'vitest'
import AIProviderAccount from '../src/models/AIProviderAccount.js'

describe('AI provider account contract', () => {
  it('does not allow Hugging Face as a chat account', () => {
    const error = new AIProviderAccount({ name: 'HF', provider: 'huggingface', model: 'detector', encryptedApiKey: 'x' }).validateSync()
    expect(error?.errors?.provider).toBeTruthy()
  })

  it('does not expose encrypted keys by default', () => {
    expect(AIProviderAccount.schema.path('encryptedApiKey').options.select).toBe(false)
  })
})
