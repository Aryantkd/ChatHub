// src/controllers/notificationController.js
import { Notification } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { activeFilter, deletedFilter, dateRangeFilter } from '../utils/softDelete.js';

// Filters: unreadOnly, type, dateFrom, dateTo — excludes soft-deleted notifications
export const getMyNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly, type, dateFrom, dateTo } = req.query;

    const filter = activeFilter({ userId: req.user._id });
    if (unreadOnly === 'true') filter.isRead = false;
    if (type) filter.type = type;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const [{ data: notifications, ...meta }, unreadCount] = await Promise.all([
      paginate(Notification, filter, { page, limit, sort: { createdAt: -1 } }),
      Notification.countDocuments({ userId: req.user._id, isRead: false, isDeleted: { $ne: true } }),
    ]);

    sendSuccess(res, { notifications, unreadCount, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Get user's soft-deleted notifications
export const getDeletedNotifications = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filter = deletedFilter({ userId: req.user._id });
    const { data: notifications, ...meta } = await paginate(Notification, filter, {
      page, limit, sort: { deletedAt: -1 },
    });
    sendSuccess(res, { notifications, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id, isDeleted: { $ne: true } },
      { isRead: true },
      { new: true }
    );
    if (!notification) return sendFailure(res, 'Notification not found', 404);
    sendSuccess(res, notification, 'Marked as read');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Soft-delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
    if (!notification) return sendFailure(res, 'Notification not found', 404);
    sendSuccess(res, null, 'Notification deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Restore a soft-deleted notification
export const restoreNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    );
    if (!notification) return sendFailure(res, 'Notification not found', 404);
    sendSuccess(res, notification, 'Notification restored');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false, isDeleted: { $ne: true } },
      { isRead: true }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
