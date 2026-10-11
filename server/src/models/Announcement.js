import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  titleEn: { type: String, required: true, trim: true, maxlength: 140 },
  titleVi: { type: String, required: true, trim: true, maxlength: 140 },
  bodyEn: { type: String, required: true, trim: true, maxlength: 10000 },
  bodyVi: { type: String, required: true, trim: true, maxlength: 10000 },
  bannerUrl: { type: String, default: '', maxlength: 2048 },
  imageUrl: { type: String, default: '', maxlength: 2048 },
  imageAltEn: { type: String, default: '', trim: true, maxlength: 250 },
  imageAltVi: { type: String, default: '', trim: true, maxlength: 250 },
  actionLabelEn: { type: String, default: '', trim: true, maxlength: 80 },
  actionLabelVi: { type: String, default: '', trim: true, maxlength: 80 },
  actionUrl: { type: String, default: '', maxlength: 2048 },
  audience: {
    type: [{ type: String, enum: ['student', 'teacher', 'parent', 'admin'] }],
    default: ['student'],
    validate: (value) => value.length > 0,
  },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date, default: null },
  priority: { type: Number, default: 0, min: 0, max: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

schema.index({ status: 1, startsAt: 1, endsAt: 1, priority: -1 })
schema.index({ status: 1, audience: 1, startsAt: 1, priority: -1 })

export default mongoose.model('Announcement', schema)
