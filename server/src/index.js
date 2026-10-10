import 'dotenv/config'
import app from './app.js'
import connectDB from './config/db.js'
import { initSocket } from './services/socket.service.js'
import { scheduleEarlyWarningScan } from './services/earlyWarning.scheduler.js'
import { scheduleSubscriptionReminders } from './services/subscriptionReminder.scheduler.js'
import AIRequest, { AI_REQUEST_RETENTION_MS } from './models/AIRequest.js'
import mongoose from 'mongoose'

if (process.env.NODE_ENV !== 'test') {
  await connectDB()
  // New unique indexes are part of correctness, not just an optimization.
  await Promise.all([
    ...['LearningSession', 'LearningOperation', 'PracticeAttempt', 'ReviewEvent', 'EssayRevision', 'WordUsageEvidence', 'DailyQuest']
      .map(name => mongoose.model(name).createIndexes()),
    AIRequest.createIndexes(),
  ])
  await AIRequest.updateMany(
    { state: 'possibly_processed', $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }] },
    { $set: { expiresAt: new Date(Date.now() + AI_REQUEST_RETENTION_MS) } },
  )
  const server = app.listen(process.env.PORT || 5000, () => console.log('LexiGrow API started'))
  initSocket(server)
  scheduleEarlyWarningScan()
  scheduleSubscriptionReminders()
}

export default app
