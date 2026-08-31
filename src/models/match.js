import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matchType: { type: String, enum: ['random', 'boosted', 'interest', 'scheduled'], default: 'random' },
  commonInterests: [String],
  status: { type: String, enum: ['active', 'ended', 'expired'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  duration: Number, // seconds
  messageCount: { type: Number, default: 0 },
  hadVideo: { type: Boolean, default: false },
  hadAudio: { type: Boolean, default: false },
  user1Rating: { type: Number, min: 1, max: 5, default: null },
  user2Rating: { type: Number, min: 1, max: 5, default: null },
  matchRoomId: { type: String, required: true }
}, { timestamps: true });

matchSchema.index({ participants: 1 });
matchSchema.index({ matchRoomId: 1 }, { unique: true });
matchSchema.index({ status: 1, startedAt: -1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;