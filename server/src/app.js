import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
if (process.env.NODE_ENV !== 'test') dotenv.config({ path: path.join(__dirname, '../.env') })
import express from 'express'
import cors from 'cors'

import errorHandler from './middleware/error.middleware.js'

const app = express()

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  req.body ??= {}
  res.set('X-Content-Type-Options', 'nosniff')
  next()
})

// CORS
app.use(cors({
  origin: globalThis.process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LexiGrow API is running', timestamp: new Date().toISOString() })
})

// Route files
import authRoutes from './routes/auth.routes.js'
import essayRoutes from './routes/essay.routes.js'
import analysisRoutes from './routes/analysis.routes.js'
import vocabularyRoutes from './routes/vocabulary.routes.js'
import progressRoutes from './routes/progress.routes.js'
import goalsRoutes from './routes/goals.routes.js'
import classRoutes from './routes/class.routes.js'
import teacherRoutes from './routes/teacher.routes.js'
import feedbackRoutes from './routes/feedback.routes.js'
import alertRoutes from './routes/alert.routes.js'
import promptRoutes from './routes/prompt.routes.js'
import profileRoutes from './routes/profile.routes.js'
import parentRoutes from './routes/parent.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import commentRoutes from './routes/comment.routes.js'
import adminRoutes from './routes/admin.routes.js'
import assignmentRoutes from './routes/assignment.routes.js'
import globalVocabularyRoutes from './routes/globalVocabulary.routes.js'
import learningSetRoutes from './routes/learningSet.routes.js'
import learningSessionRoutes from './routes/learningSession.routes.js'
import practiceRoutes from './routes/practice.routes.js'
import srsRoutes from './routes/srs.routes.js'
import gardenRoutes from './routes/garden.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import adminPricingRoutes from './routes/admin.pricing.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/essays', essayRoutes)
app.use('/api/essays', analysisRoutes)
app.use('/api/vocabulary', vocabularyRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/prompts', promptRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/parent', parentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/global-vocabulary', globalVocabularyRoutes)
app.use('/api/admin/pricing', adminPricingRoutes)
app.use('/api/admin/subscriptions', adminPricingRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/learning-sets', learningSetRoutes)
app.use('/api/sessions', learningSessionRoutes)
app.use('/api/practice', practiceRoutes)
app.use('/api/srs', srsRoutes)
app.use('/api/garden', gardenRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/subscriptions', paymentRoutes)

// Serve built frontend assets in production (Docker container or dist build)
const distPath = path.resolve(__dirname, '../../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'))
    }
    next()
  })
}

// Error handler (must be after routes)
app.use(errorHandler)

export default app
