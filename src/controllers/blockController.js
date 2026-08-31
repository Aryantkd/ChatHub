// src/controllers/blockController.js
import Block from '../models/block.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { dateRangeFilter } from '../utils/softDelete.js';

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

// Filters: reason, createdFrom, createdTo — paginated
export const getBlockedUsers = async (req, res) => {
  try {
    const { page, limit, reason, createdFrom, createdTo } = req.query;

    const filter = { blockerId: req.user._id };
    if (reason) filter.reason = reason;
    const dateRange = dateRangeFilter(createdFrom, createdTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: blocks, ...meta } = await paginate(Block, filter, {
      page, limit, sort: { createdAt: -1 },
      populate: { path: 'blockedUserId', select: 'displayName avatarUrl' },
    });

    sendSuccess(res, { blocks: blocks.map(b => b.blockedUserId), ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};
