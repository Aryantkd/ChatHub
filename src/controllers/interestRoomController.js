// src/controllers/interestRoomController.js
import { InterestRoom } from '../models/index.js';
import { sendSuccess, sendFailure } from '../helper/utils.js';

export const getActiveInterestRooms = async (req, res) => {
  try {
    const rooms = await InterestRoom.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    sendSuccess(res, rooms);
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
    const updates = {};
    const allowed = ['displayName', 'icon', 'description', 'isActive', 'sortOrder'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const room = await InterestRoom.findByIdAndUpdate(req.params.roomId, updates, {
      new: true,
      runValidators: true,
    });
    if (!room) return sendFailure(res, 'Interest room not found', 404);
    sendSuccess(res, room, 'Interest room updated');
  } catch (error) {
    sendFailure(res, error.message);
  }
};

export const deleteInterestRoom = async (req, res) => {
  try {
    const room = await InterestRoom.findByIdAndDelete(req.params.roomId);
    if (!room) return sendFailure(res, 'Interest room not found', 404);
    sendSuccess(res, null, 'Interest room deleted');
  } catch (error) {
    sendFailure(res, error.message);
  }
};
