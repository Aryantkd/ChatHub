// src/controllers/adminActionController.js
import { AdminAction, User } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const getAdminActions = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetUserId, action } = req.query;
    const filter = {};
    if (targetUserId) filter.targetUserId = targetUserId;
    if (action) filter.action = action;

    const actions = await AdminAction.find(filter)
      .populate('adminId', 'displayName email')
      .populate('targetUserId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AdminAction.countDocuments(filter);
    sendSuccess(res, { actions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const logAdminAction = async (req, res) => {
  try {
    const { targetUserId, action, reason, details } = req.body;

    const adminAction = await AdminAction.create({
      adminId: req.user._id,
      targetUserId,
      action,
      reason,
      details,
    });

    if (targetUserId) {
      const statusMap = {
        suspend: 'suspended',
        unsuspend: 'active',
        ban: 'banned',
        unban: 'active',
      };

      const userUpdate = {};
      if (statusMap[action]) userUpdate.accountStatus = statusMap[action];
      if (action === 'verify_user') { userUpdate.isVerified = true; userUpdate.verifiedAt = new Date(); }
      if (action === 'unverify_user') userUpdate.isVerified = false;
      if (action === 'warn') { userUpdate.$inc = { warningCount: 1 }; userUpdate.lastWarningDate = new Date(); }

      if (action === 'adjust_tokens' && details?.amount !== undefined) {
        await User.findByIdAndUpdate(targetUserId, { $inc: { tokenBalance: details.amount } });
      } else if (Object.keys(userUpdate).length) {
        await User.findByIdAndUpdate(targetUserId, userUpdate);
      }
    }

    await adminAction.populate('adminId targetUserId', 'displayName email');
    sendSuccess(res, adminAction, 'Action logged', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};
