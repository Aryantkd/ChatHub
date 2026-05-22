// src/controllers/adminActionController.js
import { AdminAction, User } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { dateRangeFilter } from '../utils/softDelete.js';

// Filters: targetUserId, action, adminId, dateFrom, dateTo
export const getAdminActions = async (req, res) => {
  try {
    const { page, limit, targetUserId, action, adminId, dateFrom, dateTo } = req.query;

    const filter = {};
    if (targetUserId) filter.targetUserId = targetUserId;
    if (action) filter.action = action;
    if (adminId) filter.adminId = adminId;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: actions, ...meta } = await paginate(AdminAction, filter, {
      page, limit, sort: { createdAt: -1 },
      populate: [
        { path: 'adminId', select: 'displayName email' },
        { path: 'targetUserId', select: 'displayName email' },
      ],
    });
    sendSuccess(res, { actions, ...meta });
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

      if (action === 'warn') {
        // Fix: $inc must be a top-level operator, not nested inside a plain update object
        await User.findByIdAndUpdate(targetUserId, {
          $inc: { warningCount: 1 },
          $set: { lastWarningDate: new Date() },
        });
      } else if (action === 'adjust_tokens' && details?.amount !== undefined) {
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
