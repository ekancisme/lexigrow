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
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
