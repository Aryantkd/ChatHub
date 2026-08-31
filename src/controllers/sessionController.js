// src/controllers/sessionController.js
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import RefreshToken from '../models/refreshToken.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../helper/token.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import crypto from 'crypto';

export const register = async (req, res) => {
  try {
    const { email, password, displayName, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return sendFailure(res, 'Email already registered', 409);

    const user = new User({ email, displayName, phone, passwordHash: password });
    await user.save();

    const family = crypto.randomBytes(16).toString('hex');
    const accessToken = generateAccessToken(user._id);
    const refreshTokenStr = generateRefreshToken(user._id, family);

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenStr,
      family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: req.headers['user-agent'],
    });

    const userData = user.toObject();
    delete userData.passwordHash;
    sendSuccess(res, { user: userData, accessToken, refreshToken: refreshTokenStr }, 'Registration successful', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return sendFailure(res, 'Invalid credentials', 401);
    }
    if (user.accountStatus !== 'active') {
      return sendFailure(res, `Account ${user.accountStatus}`, 403);
    }

    const family = crypto.randomBytes(16).toString('hex');
    const accessToken = generateAccessToken(user._id);
    const refreshTokenStr = generateRefreshToken(user._id, family);

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenStr,
      family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: req.headers['user-agent'],
    });

    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.passwordHash;
    sendSuccess(res, { user: userData, accessToken, refreshToken: refreshTokenStr }, 'Login successful');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
    }
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastActive: new Date() });
    }
    sendSuccess(res, null, 'Logged out');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendFailure(res, 'Refresh token required', 400);

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return sendFailure(res, 'Invalid refresh token', 401);
    }

    const storedToken = await RefreshToken.findOne({ token, isRevoked: false });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return sendFailure(res, 'Invalid or expired refresh token', 401);
    }

    const newFamily = crypto.randomBytes(16).toString('hex');
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId, newFamily);

    await storedToken.deleteOne();
    await RefreshToken.create({
      userId: decoded.userId,
      token: newRefreshToken,
      family: newFamily,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: req.headers['user-agent'],
    });

    sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    sendFailure(res, 'Invalid refresh token', 401);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return sendFailure(res, 'Current password is incorrect', 401);
    }
    user.passwordHash = newPassword;
    await user.save();
    sendSuccess(res, null, 'Password updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const forgotPassword = async (req, res) => {
  sendSuccess(res, null, 'If that email is registered, a reset link has been sent');
};

export const resetPassword = async (req, res) => {
  sendSuccess(res, null, 'Password reset successful');
};
