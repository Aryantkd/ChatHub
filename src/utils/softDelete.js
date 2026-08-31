// src/utils/softDelete.js

/** Soft-deletes a document by id. Sets isDeleted, deletedAt, deletedBy. */
export const softDeleteById = async (Model, id, deletedBy = null) => {
  return Model.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy, restoredAt: null, restoredBy: null } },
    { new: true }
  );
};

/** Restores a soft-deleted document. Clears isDeleted/deletedAt, sets restoredAt/restoredBy. */
export const restoreById = async (Model, id, restoredBy = null) => {
  return Model.findByIdAndUpdate(
    id,
    { $set: { isDeleted: false, deletedAt: null, deletedBy: null, restoredAt: new Date(), restoredBy } },
    { new: true }
  );
};

/** Merges isDeleted: { $ne: true } into any filter — use for all normal queries. */
export const activeFilter = (filter = {}) => ({ ...filter, isDeleted: { $ne: true } });

/** Merges isDeleted: true into any filter — use for trash / deleted-items views. */
export const deletedFilter = (filter = {}) => ({ ...filter, isDeleted: true });

/**
 * Builds a MongoDB date range object from optional from/to strings.
 * Returns undefined if neither is provided (so the caller can skip setting the filter key).
 */
export const dateRangeFilter = (from, to) => {
  if (!from && !to) return undefined;
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  return range;
};
