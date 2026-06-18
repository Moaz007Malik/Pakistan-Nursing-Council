const connectDB = require('../config/database');
const ApiError = require('../utils/ApiError');

const ensureDb = async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (error) {
    return next(new ApiError(503, `Database unavailable: ${error.message}`));
  }
};

module.exports = ensureDb;
