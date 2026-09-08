import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    planSlug: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['plus', 'pro', 'ultra'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    // Maximum sponsored students allowed if teacher
    maxSponsoredStudents: {
      type: Number,
      default: 0,
    },
    payosTransactionId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

subscriptionSchema.index({ user: 1, status: 1, endDate: -1 })

const Subscription = mongoose.model('Subscription', subscriptionSchema)
export default Subscription
