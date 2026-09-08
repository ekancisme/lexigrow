import mongoose from 'mongoose'

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderCode: {
      type: Number,
      required: true,
      unique: true,
    },
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
    planName: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ['plus', 'pro', 'ultra'],
      required: true,
    },
    targetRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING',
    },
    payosPaymentLinkId: {
      type: String,
      default: '',
    },
    checkoutUrl: {
      type: String,
      default: '',
    },
    qrCode: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

paymentTransactionSchema.index({ user: 1, createdAt: -1 })
paymentTransactionSchema.index({ status: 1 })

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema)
export default PaymentTransaction
