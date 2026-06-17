const paginate = (query, { page = 1, limit = 20, sort = '-createdAt' }) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  return {
    query: query.skip(skip).limit(limitNum).sort(sort),
    pagination: { page: pageNum, limit: limitNum, skip },
  };
};

const paginatedResponse = (data, total, pagination) => ({
  success: true,
  data,
  pagination: {
    page: pagination.page,
    limit: pagination.limit,
    total,
    pages: Math.ceil(total / pagination.limit),
    hasNext: pagination.page * pagination.limit < total,
    hasPrev: pagination.page > 1,
  },
});

const buildFilter = (query, allowedFields) => {
  const filter = {};
  allowedFields.forEach((field) => {
    if (query[field] !== undefined) {
      filter[field] = query[field];
    }
  });
  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  return filter;
};

module.exports = { paginate, paginatedResponse, buildFilter };
