// src/controllers/blockController.js
import Block from '../models/block.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const blockUser = async (req, res) => {
  try {
    const { blockedUserId, reason } = req.body;
    if (blockedUserId === req.user._id.toString()) {
      return sendFailure(res, 'Cannot block yourself', 400);
    }
    const existing = await Block.findOne({ blockerId: req.user._id, blockedUserId });
    if (existing) return sendFailure(res, 'Already blocked', 400);
    const block = await Block.create({ blockerId: req.user._id, blockedUserId, reason });
    sendSuccess(res, block, 'User blocked');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.params;
    await Block.findOneAndDelete({ blockerId: req.user._id, blockedUserId });
    sendSuccess(res, null, 'User unblocked');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await Block.find({ blockerId: req.user._id }).populate('blockedUserId', 'displayName avatarUrl');
    sendSuccess(res, blocks.map(b => b.blockedUserId));
  } catch (error) {
    sendFailure(res, error.message);
  }
};