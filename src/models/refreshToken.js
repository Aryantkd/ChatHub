import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, unique: true, required: true },
  family: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  deviceInfo: String
}, { timestamps: { createdAt: true, updatedAt: false } });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete
refreshTokenSchema.index({ userId: 1, family: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;