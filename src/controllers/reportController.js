// src/controllers/reportController.js
import Report from '../models/report.js';
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { dateRangeFilter } from '../utils/softDelete.js';

export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description, matchId, chatLogSnapshot } = req.body;
    if (reportedUserId === req.user._id.toString()) {
      return sendFailure(res, 'Cannot report yourself', 400);
    }
    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      matchId,
      reason,
      description,
      chatLogSnapshot,
      status: 'pending',
    });
    sendSuccess(res, report, 'Report submitted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Filters: status, reason, reporterId, reportedUserId, dateFrom, dateTo
export const getReports = async (req, res) => {
  try {
    const { page, limit, status, reason, reporterId, reportedUserId, dateFrom, dateTo } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (reporterId) filter.reporterId = reporterId;
    if (reportedUserId) filter.reportedUserId = reportedUserId;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: reports, ...meta } = await paginate(Report, filter, {
      page, limit, sort: { createdAt: -1 },
      populate: [
        { path: 'reporterId', select: 'displayName email' },
        { path: 'reportedUserId', select: 'displayName email' },
      ],
    });
    sendSuccess(res, { reports, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, note } = req.body;
    const report = await Report.findById(reportId);
    if (!report) return sendFailure(res, 'Report not found', 404);

    report.status = 'resolved';
    report.resolution = {
      action: action || 'none',
      adminId: req.user._id,
      note,
      resolvedAt: new Date(),
    };
    await report.save();

    if (action === 'suspend_24h') {
      await User.findByIdAndUpdate(report.reportedUserId, {
        accountStatus: 'suspended',
        lastWarningDate: new Date(),
      });
    } else if (action === 'ban') {
      await User.findByIdAndUpdate(report.reportedUserId, { accountStatus: 'banned' });
    }

    sendSuccess(res, report, 'Report resolved');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
