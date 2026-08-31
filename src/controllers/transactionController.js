// src/controllers/transactionController.js
import Transaction from '../models/transaction.js';
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { dateRangeFilter } from '../utils/softDelete.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const purchaseTokens = async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body; // amount in cents
    const tokenAmount = Math.floor(amount / 10); // 1 USD = 100 tokens

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
    });

    if (paymentIntent.status === 'succeeded') {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { tokenBalance: tokenAmount } },
        { new: true }
      );
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

// Filters: type, dateFrom, dateTo, minAmount, maxAmount
export const getTransactionHistory = async (req, res) => {
  try {
    const { page, limit, type, dateFrom, dateTo, minAmount, maxAmount } = req.query;

    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;
    if (minAmount || maxAmount) {
      filter.tokenAmount = {};
      if (minAmount) filter.tokenAmount.$gte = Number(minAmount);
      if (maxAmount) filter.tokenAmount.$lte = Number(maxAmount);
    }

    const { data: transactions, ...meta } = await paginate(Transaction, filter, {
      page, limit, sort: { createdAt: -1 },
    });
    sendSuccess(res, { transactions, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const sendGift = async (req, res) => {
  sendFailure(res, 'Use /api/message/gift endpoint', 400);
};
