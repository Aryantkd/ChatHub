// src/controllers/userController.js
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { softDeleteById, restoreById, activeFilter, deletedFilter, dateRangeFilter } from '../utils/softDelete.js';

export const getMyProfile = async (req, res) => {
  sendSuccess(res, req.user);
};

export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['displayName', 'bio', 'age', 'gender', 'interests', 'location'];
    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    sendSuccess(res, user, 'Profile updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) return sendFailure(res, 'Avatar URL required', 400);
    const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true });
    sendSuccess(res, user, 'Avatar updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne(activeFilter({ _id: req.params.userId })).select('-passwordHash');
    if (!user) return sendFailure(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: list all active users with rich filtering
export const getAllUsers = async (req, res) => {
  try {
    const {
      page, limit, role, accountStatus, gender, isVerified, isOnline,
      search, createdFrom, createdTo, updatedFrom, updatedTo,
    } = req.query;

    const filter = activeFilter();
    if (role) filter.role = role;
    if (accountStatus) filter.accountStatus = accountStatus;
    if (gender) filter.gender = gender;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isOnline !== undefined) filter.isOnline = isOnline === 'true';
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    const createdRange = dateRangeFilter(createdFrom, createdTo);
    if (createdRange) filter.createdAt = createdRange;
    const updatedRange = dateRangeFilter(updatedFrom, updatedTo);
    if (updatedRange) filter.updatedAt = updatedRange;

    const { data: users, ...meta } = await paginate(User, filter, {
      page, limit, select: '-passwordHash', sort: { createdAt: -1 },
    });
    sendSuccess(res, { users, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: list soft-deleted users
export const getDeletedUsers = async (req, res) => {
  try {
    const { page, limit, deletedFrom, deletedTo } = req.query;
    const filter = deletedFilter();
    const deletedRange = dateRangeFilter(deletedFrom, deletedTo);
    if (deletedRange) filter.deletedAt = deletedRange;

    const { data: users, ...meta } = await paginate(User, filter, {
      page, limit, select: '-passwordHash', sort: { deletedAt: -1 },
    });
    sendSuccess(res, { users, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { accountStatus } = req.body;
    if (!['active', 'suspended', 'banned', 'deactivated'].includes(accountStatus)) {
      return sendFailure(res, 'Invalid status', 400);
    }
    const user = await User.findOneAndUpdate(
      activeFilter({ _id: req.params.userId }),
      { accountStatus },
      { new: true }
    );
    if (!user) return sendFailure(res, 'User not found', 404);
    sendSuccess(res, user, 'Status updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: soft-delete a user
export const deleteUser = async (req, res) => {
  try {
    const user = await softDeleteById(User, req.params.userId, req.user._id);
    if (!user) return sendFailure(res, 'User not found', 404);
    sendSuccess(res, null, 'User deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: restore a soft-deleted user
export const restoreUser = async (req, res) => {
  try {
    const user = await restoreById(User, req.params.userId, req.user._id);
    if (!user) return sendFailure(res, 'User not found', 404);
    sendSuccess(res, user, 'User restored');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
