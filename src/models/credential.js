import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  platform: { type: String, enum: ['razorpay', 'stripe', 'aws', 'other'], required: true },
  key: { type: String, required: true },
  value: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  restoredAt: { type: Date, default: null },
  restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

credentialSchema.index({ platform: 1, key: 1 }, { unique: true });

const Credential = mongoose.model('Credential', credentialSchema);
export default Credential;
