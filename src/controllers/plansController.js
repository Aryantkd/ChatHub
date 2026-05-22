// src/controllers/plansController.js
import { Plan } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const createNewPlan = async (req, res) => {
  try {
    const {
      name, displayName, description, price, currency,
      interval, features, tokenBonus, stripePriceId, sortOrder,
    } = req.body;

    const existing = await Plan.findOne({ name });
    if (existing) return sendFailure(res, 'Plan with this name already exists', 409);

    const plan = await Plan.create({
      name, displayName, description, price, currency,
      interval, features, tokenBonus, stripePriceId, sortOrder,
    });

    sendSuccess(res, plan, 'Plan created', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1, price: 1 });
    sendSuccess(res, plans);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const getActivePlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
    sendSuccess(res, plans);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.planId);
    if (!plan) return sendFailure(res, 'Plan not found', 404);
    sendSuccess(res, null, 'Plan deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
