// src/controllers/notificationController.js
import { Notification } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    sendSuccess(res, {
      notifications,
      total,
      unreadCount,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return sendFailure(res, 'Notification not found', 404);
    sendSuccess(res, notification, 'Marked as read');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user._id,
    });
    if (!notification) return sendFailure(res, 'Notification not found', 404);
    sendSuccess(res, null, 'Notification deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
