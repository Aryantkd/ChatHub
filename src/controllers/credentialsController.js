// src/controllers/credentialsController.js
import { Credential } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const razorpayCredentials = async (req, res) => {
  try {
    const keyId = await Credential.findOne({ platform: 'razorpay', key: 'key_id', isActive: true });
    if (!keyId) return sendFailure(res, 'Razorpay not configured', 404);
    sendSuccess(res, { key_id: keyId.value });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getAllCredentials = async (req, res) => {
  try {
    const credentials = await Credential.find()
      .select('-value')
      .populate('addedBy', 'displayName email')
      .sort({ platform: 1, key: 1 });
    sendSuccess(res, credentials);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const addNewCredentials = async (req, res) => {
  try {
    const { platform, key, value, description } = req.body;

    const credential = await Credential.findOneAndUpdate(
      { platform, key },
      { value, description, isActive: true, addedBy: req.user._id },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const result = credential.toObject();
    delete result.value;
    sendSuccess(res, result, 'Credential saved', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const deleteCredential = async (req, res) => {
  try {
    const credential = await Credential.findByIdAndDelete(req.params.credentialId);
    if (!credential) return sendFailure(res, 'Credential not found', 404);
    sendSuccess(res, null, 'Credential deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
