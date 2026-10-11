import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  announcement: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  suppressedUntil: { type: Date, required: true },
}, { timestamps: true })

schema.index({ user: 1, announcement: 1 }, { unique: true })
schema.index({ user: 1, suppressedUntil: 1 })
schema.index({ suppressedUntil: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('AnnouncementDismissal', schema)
