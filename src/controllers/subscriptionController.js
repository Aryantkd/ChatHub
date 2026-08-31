// src/controllers/subscriptionController.js
import Subscription from '../models/subscription.js';
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionChange(subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeletion(event.data.object);
      break;
  }
  res.json({ received: true });
};

async function handleSubscriptionChange(stripeSub) {
  const existing = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
  const user = await User.findOne({ stripeCustomerId: stripeSub.customer });
  if (!user) return;

  const subData = {
    userId: user._id,
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId: stripeSub.customer,
    plan: stripeSub.items.data[0].price.nickname === 'Pro' ? 'pro' : 'premium',
    status: stripeSub.status,
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    cancelAt: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
    amount: stripeSub.items.data[0].price.unit_amount,
    interval: stripeSub.items.data[0].price.recurring.interval,
  };

  if (existing) {
    await Subscription.findByIdAndUpdate(existing._id, subData);
  } else {
    await Subscription.create(subData);
  }

  // Update user's subscription field
  user.subscription = {
    plan: subData.plan,
    status: subData.status,
    currentPeriodEnd: subData.currentPeriodEnd,
    stripeCustomerId: subData.stripeCustomerId,
    stripeSubscriptionId: subData.stripeSubscriptionId,
  };
  await user.save();
}

async function handleSubscriptionDeletion(stripeSub) {
  await Subscription.findOneAndUpdate({ stripeSubscriptionId: stripeSub.id }, { status: 'canceled', endedAt: new Date() });
  const user = await User.findOne({ stripeCustomerId: stripeSub.customer });
  if (user) {
    user.subscription.status = 'canceled';
    await user.save();
  }
}

export const getMySubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id, status: 'active' });
    sendSuccess(res, sub || { plan: 'free' });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id, status: 'active' });
    if (!sub) return sendFailure(res, 'No active subscription', 404);
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    sendSuccess(res, null, 'Subscription will cancel at period end');
  } catch (error) {
    sendFailure(res, error.message);
  }
};