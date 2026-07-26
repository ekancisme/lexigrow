import mongoose from 'mongoose'

const parentStudentLinkSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  relationship: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'other'],
    default: 'guardian',
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active',
  },
  linkedAt: {
    type: Date,
    default: Date.now,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
})

parentStudentLinkSchema.index({ parent: 1, student: 1 }, { unique: true })
parentStudentLinkSchema.index({ parent: 1, status: 1 })
parentStudentLinkSchema.index({ student: 1, status: 1 })

const ParentStudentLink = mongoose.model('ParentStudentLink', parentStudentLinkSchema)
export default ParentStudentLink