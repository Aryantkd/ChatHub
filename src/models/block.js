import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['personal', 'harassment', 'spam'] }
}, { timestamps: { createdAt: true, updatedAt: false } });

blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });
blockSchema.index({ blockedUserId: 1 });

const Block = mongoose.model('Block', blockSchema);
export default Block;