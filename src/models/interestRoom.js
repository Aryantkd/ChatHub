import mongoose from 'mongoose';

const interestRoomSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true, lowercase: true, trim: true },
  displayName: String,
  icon: String,
  description: String,
  isActive: { type: Boolean, default: true },
  sortOrder: Number
}, { timestamps: { createdAt: true, updatedAt: false } });

const InterestRoom = mongoose.model('InterestRoom', interestRoomSchema);
export default InterestRoom;