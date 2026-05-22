// src/controllers/transactionController.js
import Transaction from '../models/transaction.js';
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const purchaseTokens = async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body; // amount in cents
    // Convert amount to token (e.g., 1 USD = 100 tokens)
    const tokenAmount = Math.floor(amount / 10); // example rate

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
    });

    if (paymentIntent.status === 'succeeded') {
      // Update user balance
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { tokenBalance: tokenAmount } },
        { new: true }
      );
      // Log transaction
      const transaction = await Transaction.create({
        userId: req.user._id,
        type: 'purchase_tokens',
        amount,
        tokenAmount,
        balanceAfter: user.tokenBalance,
        stripePaymentIntentId: paymentIntent.id,
        currency: 'usd',
      });
      sendSuccess(res, { transaction, newBalance: user.tokenBalance });
    } else {
      sendFailure(res, 'Payment not succeeded');
    }
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await Transaction.countDocuments({ userId: req.user._id });
    sendSuccess(res, { transactions, totalPages: Math.ceil(total / limit), page });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const sendGift = async (req, res) => {
  // similar to messageController sendGift but use Transaction model
  // reuse the same logic or call messageController
  sendFailure(res, 'Use /api/message/gift endpoint', 400);
};