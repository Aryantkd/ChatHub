// src/controllers/userController.js
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import mongoose from 'mongoose';

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
    const user = await User.findById(req.params.userId).select('-passwordHash');
    if (!user) return sendFailure(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, accountStatus } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (accountStatus) filter.accountStatus = accountStatus;
    const users = await User.find(filter)
      .select('-passwordHash')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const count = await User.countDocuments(filter);
    sendSuccess(res, { users, totalPages: Math.ceil(count / limit), currentPage: page });
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
    const user = await User.findByIdAndUpdate(req.params.userId, { accountStatus }, { new: true });
    if (!user) return sendFailure(res, 'User not found', 404);
    sendSuccess(res, user, 'Status updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    sendSuccess(res, null, 'User deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};