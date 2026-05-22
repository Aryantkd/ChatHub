// src/utils/paginate.js

/**
 * Reusable paginator for any Mongoose model.
 * Returns { data, total, page, limit, totalPages, hasNextPage, hasPrevPage }.
 *
 * options:
 *   page      — current page (default 1, min 1)
 *   limit     — page size (default 20, max 100)
 *   sort      — Mongoose sort object (default { createdAt: -1 })
 *   select    — field projection string or object
 *   populate  — single populate config OR array of populate configs
 */
export const paginate = async (Model, filter = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (options.select) query = query.select(options.select);
  if (options.populate) {
    const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
    for (const p of pops) query = query.populate(p);
  }

  const [data, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
