// src/controllers/interestRoomController.js
import { InterestRoom } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';
import { paginate } from '../utils/paginate.js';
import { softDeleteById, restoreById, activeFilter, deletedFilter } from '../utils/softDelete.js';

// Public: active, non-deleted rooms — filters: search
export const getActiveInterestRooms = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const filter = activeFilter({ isActive: true });
    if (search) filter.displayName = { $regex: search, $options: 'i' };

    const { data: rooms, ...meta } = await paginate(InterestRoom, filter, {
      page, limit, sort: { sortOrder: 1, name: 1 },
    });
    sendSuccess(res, { rooms, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: all rooms including inactive — filters: isActive, search, includeDeleted
export const getAllInterestRooms = async (req, res) => {
  try {
    const { page, limit, isActive, search, includeDeleted } = req.query;
    const filter = includeDeleted === 'true' ? {} : activeFilter();
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.displayName = { $regex: search, $options: 'i' };

    const { data: rooms, ...meta } = await paginate(InterestRoom, filter, {
      page, limit, sort: { sortOrder: 1, name: 1 },
    });
    sendSuccess(res, { rooms, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: soft-deleted rooms only
export const getDeletedInterestRooms = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { data: rooms, ...meta } = await paginate(InterestRoom, deletedFilter(), {
      page, limit, sort: { deletedAt: -1 },
    });
    sendSuccess(res, { rooms, ...meta });
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const createInterestRoom = async (req, res) => {
  try {
    const { name, displayName, icon, description, sortOrder } = req.body;
    const existing = await InterestRoom.findOne({ name });
    if (existing) return sendFailure(res, 'Interest room with this name already exists', 409);

    const room = await InterestRoom.create({ name, displayName, icon, description, sortOrder });
    sendSuccess(res, room, 'Interest room created', 201);
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const updateInterestRoom = async (req, res) => {
  try {
    const allowed = ['displayName', 'icon', 'description', 'isActive', 'sortOrder'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const room = await InterestRoom.findOneAndUpdate(
      activeFilter({ _id: req.params.roomId }),
      updates,
      { new: true, runValidators: true }
    );
    if (!room) return sendFailure(res, 'Interest room not found', 404);
    sendSuccess(res, room, 'Interest room updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: soft-delete
export const deleteInterestRoom = async (req, res) => {
  try {
    const room = await softDeleteById(InterestRoom, req.params.roomId, req.user._id);
    if (!room) return sendFailure(res, 'Interest room not found', 404);
    sendSuccess(res, null, 'Interest room deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

// Admin: restore
export const restoreInterestRoom = async (req, res) => {
  try {
    const room = await restoreById(InterestRoom, req.params.roomId, req.user._id);
    if (!room) return sendFailure(res, 'Interest room not found', 404);
    sendSuccess(res, room, 'Interest room restored');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
