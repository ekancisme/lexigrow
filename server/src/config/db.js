import mongoose from 'mongoose'
import { encryptSecret, decryptSecret, isEncryptedSecret } from '../utils/secretCrypto.js'

const AI_CONFIG_SECRET_KEYS = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'LLAMA_API_KEY', 'HF_API_TOKEN']

const connectDB = async () => {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('❌ MongoDB Connection Error: MONGO_URI is not set. Create server/.env with MONGO_URI=mongodb://127.0.0.1:27017/lexigrow')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    
    // Auto verify legacy users
    try {
      const User = (await import('../models/User.js')).default
      await User.updateMany({ isVerified: { $exists: false } }, { $set: { isVerified: true } })
      await User.updateMany({ accountStatus: { $exists: false } }, { $set: { accountStatus: 'active' } })
    } catch (migError) {
      console.error(`Migration error: ${migError.message}`)
    }

    // Seed default system configs if they don't exist
    try {
      const Config = (await import('../models/Config.js')).default
      const AIProviderAccount = (await import('../models/AIProviderAccount.js')).default
      const { DEFAULT_ANALYSIS_PROMPT } = await import('../services/ai.service.js')

      // Re-encrypt legacy plaintext/v1 keys with the dedicated deployment key.
      // If secrets exist but the dedicated key is missing, fail closed at startup.
      const legacyConfigs = await Config.find({ key: { $in: AI_CONFIG_SECRET_KEYS }, value: { $nin: ['', null] } })
      for (const config of legacyConfigs) {
        if (isEncryptedSecret(config.value) && config.value.startsWith('v2.')) continue
        const plaintext = isEncryptedSecret(config.value) ? decryptSecret(config.value) : String(config.value)
        config.value = encryptSecret(plaintext)
        await config.save()
      }

      const providerAccounts = await AIProviderAccount.find({ encryptedApiKey: { $exists: true, $ne: '' } }).select('+encryptedApiKey')
      for (const account of providerAccounts) {
        if (isEncryptedSecret(account.encryptedApiKey) && account.encryptedApiKey.startsWith('v2.')) continue
        const plaintext = isEncryptedSecret(account.encryptedApiKey)
          ? decryptSecret(account.encryptedApiKey)
          : String(account.encryptedApiKey)
        account.encryptedApiKey = encryptSecret(plaintext)
        await account.save()
      }
      
      const defaultConfigs = [
        { key: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY || '', description: 'Groq API Key' },
        { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY || '', description: 'Google Gemini API Key' },
        { key: 'GEMINI_MODEL', value: process.env.GEMINI_MODEL || '', description: 'Google Gemini Model' },
        { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY || '', description: 'OpenAI API Key' },
        { key: 'LLAMA_API_KEY', value: process.env.LLAMA_API_KEY || '', description: 'Llama API Key' },
        { key: 'HF_API_TOKEN', value: process.env.HF_API_TOKEN || '', description: 'Hugging Face API Token' },
        { key: 'DEFAULT_AI_MODEL', value: 'llama-3.3-70b-versatile', description: 'Default AI Model for Analysis' },
        { key: 'DEFAULT_AI_COMBO', value: '', description: 'Default AI Model Combo' },
        { key: 'SYSTEM_ANALYSIS_PROMPT', value: DEFAULT_ANALYSIS_PROMPT, description: 'System Analysis Prompt Template' },
        { key: 'ALLOW_PASTE_ESSAY', value: 'true', description: 'Cho phép học sinh paste bài viết essay (true/false)' },
      ]

      for (const config of defaultConfigs) {
        const exists = await Config.findOne({ key: config.key })
        if (!exists) {
          const value = AI_CONFIG_SECRET_KEYS.includes(config.key) && config.value
            ? encryptSecret(config.value)
            : config.value
          await Config.create({ ...config, value })
          console.log(`🌱 Seeded default config: ${config.key}`)
        }
      }
    } catch (configError) {
      console.error(`Config seeding error: ${configError.message}`)
      throw configError
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
