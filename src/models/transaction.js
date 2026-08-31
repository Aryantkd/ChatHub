import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['purchase_tokens', 'send_gift', 'receive_gift', 'boost_match', 'refund', 'admin_adjustment'],
    required: true
  },
  amount: Number, // monetary amount in cents (positive = credit)
  tokenAmount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  stripePaymentIntentId: String,
  purchaseAmount: Number,
  currency: { type: String, default: 'usd' },
  giftMessage: { type: String, maxlength: 200 },
  giftItemId: String,
  boostDurationMinutes: Number,
  description: String
}, { timestamps: { createdAt: true, updatedAt: false } }); // immutable

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ targetUserId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;