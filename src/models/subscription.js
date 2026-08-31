import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripeSubscriptionId: { type: String, unique: true, sparse: true },
  stripeCustomerId: String,
  plan: { type: String, enum: ['pro', 'premium'] },
  status: { type: String, enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing', 'ended'] },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  canceledAt: Date,
  endedAt: Date,
  trialEnd: Date,
  amount: Number, // in cents
  currency: { type: String, default: 'usd' },
  interval: { type: String, enum: ['month', 'year'] }
}, { timestamps: true });

subscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;