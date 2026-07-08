import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an assignment title'],
      trim: true,
      maxlength: [300, 'Title cannot be more than 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    keywords: {
      type: [String],
      default: [],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Assignment must belong to a class'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

// Index for fast lookup by class
assignmentSchema.index({ classId: 1, createdAt: -1 })
assignmentSchema.index({ teacher: 1 })

const Assignment = mongoose.model('Assignment', assignmentSchema)
export default Assignment
