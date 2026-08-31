// src/controllers/matchController.js
import Match from '../models/match.js';
import User from '../models/user.js';
import Block from '../models/block.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { dateRangeFilter } from '../utils/softDelete.js';
import crypto from 'crypto';

const findMatchCandidate = async (userId, interests = []) => {
  // Fetch users the requester has blocked or been blocked by
  const blockDocs = await Block.find({
    $or: [{ blockerId: userId }, { blockedUserId: userId }],
  }).select('blockerId blockedUserId');

  const blockedIds = blockDocs.map(b =>
    b.blockerId.equals(userId) ? b.blockedUserId : b.blockerId
  );

  const matchQuery = {
    _id: { $ne: userId, $nin: blockedIds },
    isOnline: true,
    accountStatus: 'active',
    isDeleted: { $ne: true },
  };
  if (interests.length) matchQuery.interests = { $in: interests };

  const candidates = await User.find(matchQuery).limit(10);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const createRandomMatch = async (req, res) => {
  try {
    const matchedUser = await findMatchCandidate(req.user._id);
    if (!matchedUser) return sendFailure(res, 'No users available to match', 404);

    const matchRoomId = crypto.randomUUID();
    const match = await Match.create({
      participants: [req.user._id, matchedUser._id],
      matchType: 'random',
      matchRoomId,
      status: 'active',
      startedAt: new Date(),
    });

    const io = req.app.get('io');
    io?.to(`user:${matchedUser._id}`).emit('new_match', { matchId: match._id, matchRoomId });

    sendSuccess(res, { matchId: match._id, matchRoomId, matchedUser });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const createInterestMatch = async (req, res) => {
  try {
    const { interest } = req.body;
    if (!interest) return sendFailure(res, 'Interest required', 400);

    const matchedUser = await findMatchCandidate(req.user._id, [interest]);
    if (!matchedUser) return sendFailure(res, 'No match found for this interest', 404);

    const matchRoomId = crypto.randomUUID();
    const match = await Match.create({
      participants: [req.user._id, matchedUser._id],
      matchType: 'interest',
      commonInterests: [interest],
      matchRoomId,
    });

    const io = req.app.get('io');
    io?.to(`user:${matchedUser._id}`).emit('new_match', { matchId: match._id, matchRoomId });

    sendSuccess(res, { matchId: match._id, matchRoomId, match, matchedUser });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const createBoostedMatch = async (req, res) => {
  try {
    const BOOST_TOKEN_COST = 10;
    const user = await User.findById(req.user._id);
    if (user.tokenBalance < BOOST_TOKEN_COST) return sendFailure(res, 'Insufficient tokens for boost', 400);

    const matchedUser = await findMatchCandidate(req.user._id);
    if (!matchedUser) return sendFailure(res, 'No users available to match', 404);

    user.tokenBalance -= BOOST_TOKEN_COST;
    await user.save();

    const matchRoomId = crypto.randomUUID();
    const match = await Match.create({
      participants: [req.user._id, matchedUser._id],
      matchType: 'boosted',
      matchRoomId,
      status: 'active',
      startedAt: new Date(),
    });

    sendSuccess(res, { matchId: match._id, matchRoomId, matchedUser });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const endMatch = async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);
    if (match.status !== 'active') return sendFailure(res, 'Match already ended', 400);

    match.status = 'ended';
    match.endedAt = new Date();
    match.duration = Math.floor((match.endedAt - match.startedAt) / 1000);
    await match.save();

    const io = req.app.get('io');
    io?.to(match.matchRoomId).emit('match_ended', { matchId: match._id });

    sendSuccess(res, match, 'Match ended');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const rateMatch = async (req, res) => {
  try {
    const { matchId, rating } = req.body;
    const match = await Match.findOne({ _id: matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);
    if (match.status !== 'ended') return sendFailure(res, 'Can only rate ended matches', 400);

    const isUser1 = match.participants[0].equals(req.user._id);
    if (isUser1) match.user1Rating = rating;
    else match.user2Rating = rating;
    await match.save();

    sendSuccess(res, match, 'Rating submitted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Filters: matchType, startedFrom, startedTo, minDuration, minRating
export const getMatchHistory = async (req, res) => {
  try {
    const { page, limit, matchType, startedFrom, startedTo, minDuration, minRating } = req.query;

    const filter = { participants: req.user._id, status: 'ended' };
    if (matchType) filter.matchType = matchType;
    const startedRange = dateRangeFilter(startedFrom, startedTo);
    if (startedRange) filter.startedAt = startedRange;
    if (minDuration) filter.duration = { $gte: Number(minDuration) };
    if (minRating) {
      filter.$or = [
        { user1Rating: { $gte: Number(minRating) } },
        { user2Rating: { $gte: Number(minRating) } },
      ];
    }

    const { data: matches, ...meta } = await paginate(Match, filter, {
      page,
      limit,
      sort: { endedAt: -1 },
      populate: { path: 'participants', select: 'displayName avatarUrl' },
    });
    sendSuccess(res, { matches, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Filters: matchType
export const getActiveMatches = async (req, res) => {
  try {
    const { matchType } = req.query;
    const filter = { participants: req.user._id, status: 'active' };
    if (matchType) filter.matchType = matchType;

    const matches = await Match.find(filter)
      .populate('participants', 'displayName avatarUrl isOnline');
    sendSuccess(res, matches);
  } catch (error) {
    sendFailure(res, error.message);
  }
};
