import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, maxlength: 1000 },
  type: { type: String, enum: ['text', 'gift', 'system'], default: 'text' },
  giftData: {
    giftItemId: String,
    tokenAmount: Number,
    message: String,
  },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

messageSchema.index({ matchId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ isDeleted: 1 });
// Optional TTL for auto-deletion after 30 days
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
