// src/controllers/scheduledEventController.js
import { ScheduledEvent, User, Transaction } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import crypto from 'crypto';

export const createScheduledEvent = async (req, res) => {
  try {
    const {
      title, description, interestTags, scheduledAt,
      durationMinutes, maxParticipants, entryFeeTokens, requiresSubscription,
    } = req.body;

    const event = await ScheduledEvent.create({
      hostId: req.user._id,
      title,
      description,
      interestTags,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      maxParticipants: maxParticipants || 0,
      entryFeeTokens: entryFeeTokens || 0,
      requiresSubscription: requiresSubscription || false,
      roomId: crypto.randomUUID(),
      status: 'upcoming',
    });

    sendSuccess(res, event, 'Event created', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getScheduledEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'upcoming', interest } = req.query;
    const filter = { status };
    if (interest) filter.interestTags = interest;

    const events = await ScheduledEvent.find(filter)
      .populate('hostId', 'displayName avatarUrl')
      .sort({ scheduledAt: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ScheduledEvent.countDocuments(filter);
    sendSuccess(res, { events, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const joinScheduledEvent = async (req, res) => {
  try {
    const event = await ScheduledEvent.findById(req.params.eventId);
    if (!event) return sendFailure(res, 'Event not found', 404);
    if (event.status !== 'upcoming') return sendFailure(res, 'Event is not accepting participants', 400);

    const alreadyJoined = event.participants.some(p => p.userId.equals(req.user._id));
    if (alreadyJoined) return sendFailure(res, 'Already joined this event', 400);

    if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
      return sendFailure(res, 'Event is full', 400);
    }

    if (event.requiresSubscription && req.user.subscription?.plan === 'free') {
      return sendFailure(res, 'Subscription required to join this event', 403);
    }

    if (event.entryFeeTokens > 0) {
      const user = await User.findById(req.user._id);
      if (user.tokenBalance < event.entryFeeTokens) return sendFailure(res, 'Insufficient tokens', 400);
      user.tokenBalance -= event.entryFeeTokens;
      await user.save();

      await Transaction.create({
        userId: req.user._id,
        type: 'boost_match',
        tokenAmount: -event.entryFeeTokens,
        balanceAfter: user.tokenBalance,
        description: `Entry fee for event: ${event.title}`,
      });
    }

    event.participants.push({ userId: req.user._id, joinedAt: new Date() });
    await event.save();

    sendSuccess(res, event, 'Joined event');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const cancelScheduledEvent = async (req, res) => {
  try {
    const query = { _id: req.params.eventId };
    if (req.user.role !== 'admin') query.hostId = req.user._id;

    const event = await ScheduledEvent.findOne(query);
    if (!event) return sendFailure(res, 'Event not found or unauthorized', 404);
    if (event.status === 'ended') return sendFailure(res, 'Event already ended', 400);

    event.status = 'canceled';
    await event.save();

    sendSuccess(res, null, 'Event canceled');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
