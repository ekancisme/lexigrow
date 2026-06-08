import mongoose from 'mongoose'

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a class name'],
    trim: true,
    maxlength: [200, 'Class name cannot be more than 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  schedule: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Virtual for student count
classSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0
})

const Class = mongoose.model('Class', classSchema)
export default Class
