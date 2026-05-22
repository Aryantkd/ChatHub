import mongoose from 'mongoose';

const scheduledEventSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  interestTags: [String],
  scheduledAt: Date,
  durationMinutes: Number,
  maxParticipants: { type: Number, default: 0 },
  entryFeeTokens: { type: Number, default: 0 },
  requiresSubscription: { type: Boolean, default: false },
  roomId: String,
  status: { type: String, enum: ['upcoming', 'live', 'ended', 'canceled'], default: 'upcoming' },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: Date
  }]
}, { timestamps: true });

const ScheduledEvent = mongoose.model('ScheduledEvent', scheduledEventSchema);
export default ScheduledEvent;