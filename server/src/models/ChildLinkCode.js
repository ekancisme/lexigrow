import mongoose from 'mongoose'

const childLinkCodeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  codeHash: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
    default: null,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
})

childLinkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
childLinkCodeSchema.index({ student: 1, usedAt: 1 })

const ChildLinkCode = mongoose.model('ChildLinkCode', childLinkCodeSchema)
export default ChildLinkCode