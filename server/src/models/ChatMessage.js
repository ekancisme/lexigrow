import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = message to admin support room
    },
    room: {
      type: String,
      required: true,
      default: 'support', // 'support' for general CSKH, or 'user:{userId}' for private chat
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // For admin assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // For file attachments (optional)
    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

chatMessageSchema.index({ room: 1, createdAt: -1 })
chatMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 })
chatMessageSchema.index({ assignedTo: 1, isRead: 1 })

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)
export default ChatMessage