import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
  reason: {
    type: String,
    enum: ['harassment', 'nudity', 'spam', 'hate_speech', 'underage', 'illegal_content', 'other'],
    required: true
  },
  description: { type: String, maxlength: 500 },
  screenshotUrls: [String],
  chatLogSnapshot: [{
    senderId: mongoose.Schema.Types.ObjectId,
    message: String,
    timestamp: Date
  }],
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  resolution: {
    action: { type: String, enum: ['none', 'warning', 'suspend_24h', 'suspend_7d', 'ban', 'content_removed'] },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    resolvedAt: Date
  }
}, { timestamps: true });

reportSchema.index({ reportedUserId: 1, status: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ matchId: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;