// src/controllers/verificationController.js
import { Verification, User } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { dateRangeFilter } from '../utils/softDelete.js';

export const submitVerification = async (req, res) => {
  try {
    const { idDocumentFrontUrl, idDocumentBackUrl, selfieWithIdUrl, documentType } = req.body;

    const existing = await Verification.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      const msg = existing.status === 'approved' ? 'Already verified' : 'Verification already pending review';
      return sendFailure(res, msg, 400);
    }

    const verification = await Verification.create({
      userId: req.user._id,
      idDocumentFrontUrl,
      idDocumentBackUrl,
      selfieWithIdUrl,
      documentType,
      status: 'pending',
    });

    sendSuccess(res, verification, 'Verification submitted successfully', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getMyVerificationStatus = async (req, res) => {
  try {
    const verification = await Verification.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    sendSuccess(res, verification || { status: 'not_submitted' });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const reviewVerification = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status, rejectionReason } = req.body;

    const verification = await Verification.findById(verificationId);
    if (!verification) return sendFailure(res, 'Verification not found', 404);
    if (verification.status !== 'pending') return sendFailure(res, 'Verification already reviewed', 400);

    verification.status = status;
    verification.reviewerAdminId = req.user._id;
    verification.reviewedAt = new Date();
    if (status === 'rejected' && rejectionReason) verification.rejectionReason = rejectionReason;
    if (status === 'approved') verification.isOver18 = true;
    await verification.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(verification.userId, {
        isVerified: true,
        isAgeVerified: true,
        verifiedAt: new Date(),
      });
    }

    sendSuccess(res, verification, `Verification ${status}`);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: pending queue — filters: documentType, dateFrom, dateTo
export const getPendingVerifications = async (req, res) => {
  try {
    const { page, limit, documentType, dateFrom, dateTo } = req.query;
    const filter = { status: 'pending' };
    if (documentType) filter.documentType = documentType;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: verifications, ...meta } = await paginate(Verification, filter, {
      page, limit, sort: { createdAt: 1 },
      populate: { path: 'userId', select: 'displayName email avatarUrl' },
    });
    sendSuccess(res, { verifications, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: all verifications — filters: status, documentType, dateFrom, dateTo
export const getAllVerifications = async (req, res) => {
  try {
    const { page, limit, status, documentType, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;
    const dateRange = dateRangeFilter(dateFrom, dateTo);
    if (dateRange) filter.createdAt = dateRange;

    const { data: verifications, ...meta } = await paginate(Verification, filter, {
      page, limit, sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'displayName email avatarUrl' },
        { path: 'reviewerAdminId', select: 'displayName email' },
      ],
    });
    sendSuccess(res, { verifications, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};
