import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import errorHandler from './middleware/error.middleware.js'

// Connect to database
connectDB()

const app = express()

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.use('/api/auth', authRoutes)
app.use('/api/essays', essayRoutes)
app.use('/api/essays', analysisRoutes)

import vocabularyRoutes from './routes/vocabulary.routes.js'
import progressRoutes from './routes/progress.routes.js'
import goalsRoutes from './routes/goals.routes.js'

app.use('/api/vocabulary', vocabularyRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/goals', goalsRoutes)

// TODO: Mount remaining route files (will be added in subsequent commits)
// app.use('/api/classes', classRoutes)
// app.use('/api/teacher', teacherRoutes)
// app.use('/api/feedback', feedbackRoutes)
// app.use('/api/alerts', alertRoutes)
// app.use('/api/prompts', promptRoutes)
// app.use('/api/profile', profileRoutes)

// Error handler (must be after routes)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 LexiGrow Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

export default app
