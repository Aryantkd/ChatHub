import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  platform: { type: String, enum: ['razorpay', 'stripe', 'aws', 'other'], required: true },
  key: { type: String, required: true },
  value: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

credentialSchema.index({ platform: 1, key: 1 }, { unique: true });

const Credential = mongoose.model('Credential', credentialSchema);
export default Credential;
