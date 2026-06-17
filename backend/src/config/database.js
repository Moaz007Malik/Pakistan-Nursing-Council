const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error.message?.includes('Authentication failed')) {
      logger.error(
        'MongoDB authentication failed. If using local MongoDB (no Docker), set MONGODB_URI=mongodb://127.0.0.1:27017/pnmc in backend/.env. If using Docker MongoDB, use admin:changeme credentials and ensure docker compose up -d mongodb is running.'
      );
    }
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
