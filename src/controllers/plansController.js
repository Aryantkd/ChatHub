// src/controllers/plansController.js
import { Plan } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { softDeleteById, restoreById, activeFilter, deletedFilter } from '../utils/softDelete.js';

export const createNewPlan = async (req, res) => {
  try {
    const {
      name, displayName, description, price, currency,
      interval, features, tokenBonus, stripePriceId, sortOrder,
    } = req.body;

    const existing = await Plan.findOne(activeFilter({ name }));
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

// Admin: all plans — filters: interval, isActive, minPrice, maxPrice, includeDeleted
export const getAllPlans = async (req, res) => {
  try {
    const { page, limit, interval, isActive, minPrice, maxPrice, includeDeleted } = req.query;
    const filter = includeDeleted === 'true' ? {} : activeFilter();
    if (interval) filter.interval = interval;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const { data: plans, ...meta } = await paginate(Plan, filter, {
      page, limit, sort: { sortOrder: 1, price: 1 },
    });
    sendSuccess(res, { plans, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Public: active, non-deleted plans
export const getActivePlans = async (req, res) => {
  try {
    const { interval } = req.query;
    const filter = activeFilter({ isActive: true });
    if (interval) filter.interval = interval;

    const plans = await Plan.find(filter).sort({ sortOrder: 1, price: 1 });
    sendSuccess(res, plans);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: soft-delete (preserves subscription history references)
export const deletePlan = async (req, res) => {
  try {
    const plan = await softDeleteById(Plan, req.params.planId, req.user._id);
    if (!plan) return sendFailure(res, 'Plan not found', 404);
    sendSuccess(res, null, 'Plan deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: restore
export const restorePlan = async (req, res) => {
  try {
    const plan = await restoreById(Plan, req.params.planId, req.user._id);
    if (!plan) return sendFailure(res, 'Plan not found', 404);
    sendSuccess(res, plan, 'Plan restored');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
