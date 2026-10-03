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

  it('accepts optional per-account input and output pricing fields', () => {
    const account = new AIProviderAccount({
      name: 'Custom model',
      provider: 'openai-compatible',
      model: 'vendor-model-v2',
      encryptedApiKey: 'encrypted',
      inputCostPerMillionUsd: 1.25,
      outputCostPerMillionUsd: 4.5,
    })
    expect(account.validateSync()).toBeUndefined()
    expect(account.inputCostPerMillionUsd).toBe(1.25)
    expect(account.outputCostPerMillionUsd).toBe(4.5)
  })

  it('rejects negative per-account pricing', () => {
    const account = new AIProviderAccount({
      name: 'Invalid model',
      provider: 'groq',
      model: 'model',
      encryptedApiKey: 'encrypted',
      inputCostPerMillionUsd: -1,
      outputCostPerMillionUsd: 1,
    })
    expect(account.validateSync()?.errors?.inputCostPerMillionUsd).toBeTruthy()
  })
})
