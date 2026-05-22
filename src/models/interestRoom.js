import mongoose from 'mongoose';

const interestRoomSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true, lowercase: true, trim: true },
  displayName: String,
  icon: String,
  description: String,
  isActive: { type: Boolean, default: true },
  sortOrder: Number,
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  restoredAt: { type: Date, default: null },
  restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

interestRoomSchema.index({ isDeleted: 1, isActive: 1, sortOrder: 1 });

const InterestRoom = mongoose.model('InterestRoom', interestRoomSchema);
export default InterestRoom;
