import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: ['suspend', 'unsuspend', 'ban', 'unban', 'verify_user', 'unverify_user', 'warn', 'adjust_tokens', 'remove_content']
  },
  reason: String,
  details: mongoose.Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } });

const AdminAction = mongoose.model('AdminAction', adminActionSchema);
export default AdminAction;