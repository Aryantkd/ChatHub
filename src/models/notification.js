import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_match', 'gift_received', 'subscription_expiring', 'friend_request', 'system_alert', 'event_reminder']
  },
  title: String,
  message: String,
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  isEmailed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;