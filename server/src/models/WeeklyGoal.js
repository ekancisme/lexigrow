import mongoose from 'mongoose'

const goalItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  target: {
    type: Number,
    required: true,
    min: 0,
  },
  current: {
    type: Number,
    default: 0,
    min: 0,
  },
  icon: {
    type: String,
    default: 'flag',
  },
  color: {
    type: String,
    default: 'primary',
  },
}, { _id: false })

const weeklyGoalSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weekStart: {
    type: Date,
    required: true,
  },
  weekEnd: {
    type: Date,
    required: true,
  },
  goals: [goalItemSchema],
}, {
  timestamps: true,
})

// One goal set per student per week
weeklyGoalSchema.index({ student: 1, weekStart: 1 }, { unique: true })

const WeeklyGoal = mongoose.model('WeeklyGoal', weeklyGoalSchema)
export default WeeklyGoal
