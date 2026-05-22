// src/controllers/reportController.js
import Report from '../models/report.js';
import User from '../models/user.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

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

export const getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const reports = await Report.find(filter)
      .populate('reporterId reportedUserId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await Report.countDocuments(filter);
    sendSuccess(res, { reports, totalPages: Math.ceil(total / limit), page });
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

    // Apply punishment to reported user
    if (action === 'suspend_24h') {
      await User.findByIdAndUpdate(report.reportedUserId, { accountStatus: 'suspended', lastWarningDate: new Date() });
    } else if (action === 'ban') {
      await User.findByIdAndUpdate(report.reportedUserId, { accountStatus: 'banned' });
    }

    sendSuccess(res, report, 'Report resolved');
  } catch (error) {
    sendFailure(res, error.message);
  }
};