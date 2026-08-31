// src/controllers/credentialsController.js
import { Credential } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { softDeleteById, restoreById, activeFilter, deletedFilter } from '../utils/softDelete.js';

export const razorpayCredentials = async (req, res) => {
  try {
    const keyId = await Credential.findOne(activeFilter({ platform: 'razorpay', key: 'key_id', isActive: true }));
    if (!keyId) return sendFailure(res, 'Razorpay not configured', 404);
    sendSuccess(res, { key_id: keyId.value });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: list credentials — filters: platform, isActive, includeDeleted
export const getAllCredentials = async (req, res) => {
  try {
    const { page, limit, platform, isActive, includeDeleted } = req.query;
    const filter = includeDeleted === 'true' ? {} : activeFilter();
    if (platform) filter.platform = platform;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const { data: credentials, ...meta } = await paginate(Credential, filter, {
      page, limit, sort: { platform: 1, key: 1 },
      select: '-value',
      populate: { path: 'addedBy', select: 'displayName email' },
    });
    sendSuccess(res, { credentials, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const addNewCredentials = async (req, res) => {
  try {
    const { platform, key, value, description } = req.body;

    const credential = await Credential.findOneAndUpdate(
      { platform, key },
      { value, description, isActive: true, addedBy: req.user._id, isDeleted: false, deletedAt: null },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const result = credential.toObject();
    delete result.value;
    sendSuccess(res, result, 'Credential saved', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: soft-delete
export const deleteCredential = async (req, res) => {
  try {
    const credential = await softDeleteById(Credential, req.params.credentialId, req.user._id);
    if (!credential) return sendFailure(res, 'Credential not found', 404);
    sendSuccess(res, null, 'Credential deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: restore
export const restoreCredential = async (req, res) => {
  try {
    const credential = await restoreById(Credential, req.params.credentialId, req.user._id);
    if (!credential) return sendFailure(res, 'Credential not found', 404);
    const result = credential.toObject();
    delete result.value;
    sendSuccess(res, result, 'Credential restored');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
