import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    targetRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['free', 'plus', 'pro', 'ultra'],
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    features: {
      type: [String],
      default: [],
    },
    // For teacher plans: quota of students allowed to be sponsored
    maxSponsoredStudents: {
      type: Number,
      default: 0, // 0 for student plans
    },
    // Maximum classes allowed to create
    maxClasses: {
      type: Number,
      default: 1,
    },
    dailyAiEssayLimit: {
      type: Number,
      default: 3, // 3 for free, 15 for plus, -1 for unlimited
    },
    highlightBadge: {
      type: String,
      default: '', // e.g. 'Phổ biến nhất', 'Khuyên dùng'
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

subscriptionPlanSchema.index({ targetRole: 1, isActive: 1, sortOrder: 1 })

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema)
export default SubscriptionPlan
