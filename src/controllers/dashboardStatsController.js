// src/controllers/dashboardStatsController.js
import { User, Match, Transaction, Report, Subscription, Verification } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisMonth,
      bannedUsers,
      totalMatches,
      activeMatches,
      matchesToday,
      pendingReports,
      totalReports,
      activeSubscriptions,
      pendingVerifications,
      revenueThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: 'active' }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ accountStatus: 'banned' }),
      Match.countDocuments(),
      Match.countDocuments({ status: 'active' }),
      Match.countDocuments({ createdAt: { $gte: startOfDay } }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Verification.countDocuments({ status: 'pending' }),
      Transaction.aggregate([
        { $match: { type: 'purchase_tokens', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    sendSuccess(res, {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
      },
      matches: {
        total: totalMatches,
        active: activeMatches,
        today: matchesToday,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
      subscriptions: { active: activeSubscriptions },
      verifications: { pending: pendingVerifications },
      revenue: {
        thisMonth: revenueThisMonth[0]?.total || 0,
      },
    });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getRecentRegistrations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const users = await User.find()
      .select('displayName email avatarUrl createdAt accountStatus role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    sendSuccess(res, users);
  } catch (error) {
    sendFailure(res, error.message);
  }
};
