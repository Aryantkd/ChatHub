// src/controllers/dashboardStatsController.js
import { User, Match, Transaction, Report, Subscription, Verification } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { activeFilter, dateRangeFilter } from '../utils/softDelete.js';

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
      deletedUsers,
      totalMatches,
      activeMatches,
      matchesToday,
      pendingReports,
      totalReports,
      activeSubscriptions,
      pendingVerifications,
      revenueThisMonth,
    ] = await Promise.all([
      User.countDocuments(activeFilter()),
      User.countDocuments(activeFilter({ accountStatus: 'active' })),
      User.countDocuments(activeFilter({ createdAt: { $gte: startOfDay } })),
      User.countDocuments(activeFilter({ createdAt: { $gte: startOfMonth } })),
      User.countDocuments(activeFilter({ accountStatus: 'banned' })),
      User.countDocuments({ isDeleted: true }),
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
        deleted: deletedUsers,
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

// Filters: accountStatus, role, dateFrom, dateTo
export const getRecentRegistrations = async (req, res) => {
  try {
    const { limit, accountStatus, role, dateFrom, dateTo } = req.query;
    const filter = activeFilter();
    if (accountStatus) filter.accountStatus = accountStatus;
    if (role) filter.role = role;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: users, ...meta } = await paginate(User, filter, {
      limit: limit || 10,
      page: 1,
      select: 'displayName email avatarUrl createdAt accountStatus role',
      sort: { createdAt: -1 },
    });
    sendSuccess(res, { users, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};
