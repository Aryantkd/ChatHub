// src/controllers/messageController.js
import Message from '../models/message.js';
import Match from '../models/match.js';
import User from '../models/user.js';
import Block from '../models/block.js';
import Transaction from '../models/transaction.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { activeFilter, dateRangeFilter } from '../utils/softDelete.js';

export const sendMessage = async (req, res) => {
  try {
    const { matchId, message, type = 'text' } = req.body;
    const match = await Match.findOne({ _id: matchId, participants: req.user._id, status: 'active' });
    if (!match) return sendFailure(res, 'Active match not found', 404);

    const receiverId = match.participants.find(p => !p.equals(req.user._id));

    // Enforce block: don't allow messages if either party blocked the other
    const block = await Block.findOne({
      $or: [
        { blockerId: req.user._id, blockedUserId: receiverId },
        { blockerId: receiverId, blockedUserId: req.user._id },
      ],
    });
    if (block) return sendFailure(res, 'Cannot send message to this user', 403);

    const newMessage = await Message.create({
      matchId,
      senderId: req.user._id,
      receiverId,
      message,
      type,
    });

    match.messageCount += 1;
    await match.save();

    const io = req.app.get('io');
    io?.to(match.matchRoomId).emit('new_message', newMessage);

    sendSuccess(res, newMessage, 'Message sent');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Filters: type, dateFrom, dateTo — excludes soft-deleted messages
export const getMatchMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page, limit, type, dateFrom, dateTo } = req.query;

    const match = await Match.findOne({ _id: matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);

    const filter = activeFilter({ matchId });
    if (type) filter.type = type;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: messages, ...meta } = await paginate(Message, filter, {
      page, limit, sort: { createdAt: 1 },
    });
    sendSuccess(res, { messages, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findOne({ _id: matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);
    await Message.updateMany(
      { matchId, receiverId: req.user._id, isRead: false, isDeleted: { $ne: true } },
      { isRead: true }
    );
    sendSuccess(res, null, 'Messages marked as read');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Soft-delete own message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findOneAndUpdate(
      { _id: messageId, senderId: req.user._id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id } },
      { new: true }
    );
    if (!message) return sendFailure(res, 'Message not found', 404);
    sendSuccess(res, null, 'Message deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const sendGift = async (req, res) => {
  try {
    const { matchId, giftItemId, tokenAmount, message } = req.body;
    if (!tokenAmount || tokenAmount <= 0) return sendFailure(res, 'Invalid token amount', 400);

    const match = await Match.findOne({ _id: matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);

    const receiverId = match.participants.find(p => !p.equals(req.user._id));
    const sender = await User.findById(req.user._id);
    if (sender.tokenBalance < tokenAmount) return sendFailure(res, 'Insufficient tokens', 400);

    sender.tokenBalance -= tokenAmount;
    await sender.save();

    const receiver = await User.findByIdAndUpdate(
      receiverId,
      { $inc: { tokenBalance: tokenAmount } },
      { new: true }
    );

    const giftMessage = await Message.create({
      matchId,
      senderId: req.user._id,
      receiverId,
      type: 'gift',
      giftData: { giftItemId, tokenAmount, message },
    });

    await Transaction.create({
      userId: req.user._id,
      type: 'send_gift',
      tokenAmount: -tokenAmount,
      balanceAfter: sender.tokenBalance,
      targetUserId: receiverId,
      giftMessage: message,
      giftItemId,
    });

    await Transaction.create({
      userId: receiverId,
      type: 'receive_gift',
      tokenAmount,
      balanceAfter: receiver.tokenBalance,
      targetUserId: req.user._id,
      giftMessage: message,
      giftItemId,
    });

    const io = req.app.get('io');
    io?.to(match.matchRoomId).emit('gift_sent', giftMessage);

    sendSuccess(res, giftMessage, 'Gift sent');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
