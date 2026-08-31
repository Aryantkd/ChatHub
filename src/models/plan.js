import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  displayName: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd' },
  interval: { type: String, enum: ['month', 'year'], required: true },
  features: [{ type: String }],
  tokenBonus: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  stripePriceId: { type: String, sparse: true },
  sortOrder: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  restoredAt: { type: Date, default: null },
  restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

planSchema.index({ isActive: 1, sortOrder: 1 });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
