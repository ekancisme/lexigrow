import mongoose from 'mongoose'

const systemPromptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a prompt name'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Feedback', 'Analysis', 'Reports', 'Scoring', 'Other'],
    default: 'Other',
  },
  template: {
    type: String,
    required: [true, 'Please add a prompt template'],
  },
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'draft',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUsed: {
    type: Date,
  },
}, {
  timestamps: true,
})

systemPromptSchema.index({ teacher: 1, status: 1 })

const SystemPrompt = mongoose.model('SystemPrompt', systemPromptSchema)
export default SystemPrompt
