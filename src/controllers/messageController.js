// src/controllers/messageController.js
import Message from '../models/message.js';
import Match from '../models/match.js';
import User from '../models/user.js';
import Transaction from '../models/transaction.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const sendMessage = async (req, res) => {
  try {
    const { matchId, message, type = 'text' } = req.body;
    const match = await Match.findOne({ _id: matchId, participants: req.user._id, status: 'active' });
    if (!match) return sendFailure(res, 'Active match not found', 404);

    const receiverId = match.participants.find(p => !p.equals(req.user._id));
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

export const getMatchMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const match = await Match.findOne({ _id: matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);

    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Message.countDocuments({ matchId });

    sendSuccess(res, { messages, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findOne({ _id: matchId, participants: req.user._id });
    if (!match) return sendFailure(res, 'Match not found', 404);
    await Message.updateMany({ matchId, receiverId: req.user._id, isRead: false }, { isRead: true });
    sendSuccess(res, null, 'Messages marked as read');
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
