const mongoose = require('mongoose');
const connectDB = require('../config/database');
const ApiError = require('../utils/ApiError');

module.exports = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  try {
    await connectDB();
    return next();
  } catch (error) {
    return next(new ApiError(503, `Database unavailable: ${error.message}`));
  }
};
