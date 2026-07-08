import mongoose from 'mongoose'

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
    } catch (migError) {
      console.error(`Migration error: ${migError.message}`)
    }

    // Seed default system configs if they don't exist
    try {
      const Config = (await import('../models/Config.js')).default
      const { DEFAULT_ANALYSIS_PROMPT } = await import('../services/ai.service.js')
      
      const defaultConfigs = [
        { key: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY || '', description: 'Groq API Key' },
        { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY || '', description: 'OpenAI API Key' },
        { key: 'LLAMA_API_KEY', value: process.env.LLAMA_API_KEY || '', description: 'Llama API Key' },
        { key: 'DEFAULT_AI_MODEL', value: 'llama-3.3-70b-versatile', description: 'Default AI Model for Analysis' },
        { key: 'SYSTEM_ANALYSIS_PROMPT', value: DEFAULT_ANALYSIS_PROMPT, description: 'System Analysis Prompt Template' },
      ]

      for (const config of defaultConfigs) {
        const exists = await Config.findOne({ key: config.key })
        if (!exists) {
          await Config.create(config)
          console.log(`🌱 Seeded default config: ${config.key}`)
        }
      }
    } catch (configError) {
      console.error(`Config seeding error: ${configError.message}`)
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
