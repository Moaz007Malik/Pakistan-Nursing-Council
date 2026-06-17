const mongoose = require('mongoose');
const logger = require('../utils/logger');
const {
  resolveMongoUri,
  getMongoConnectOptions,
  isSrvLookupError,
} = require('./mongodbUri');

const connectDB = async () => {
  const options = getMongoConnectOptions();

  const tryConnect = async (forceDirect = false) => {
    const uri = await resolveMongoUri({ forceDirect });
    const mode = forceDirect || uri.startsWith('mongodb://') ? 'direct' : 'srv';
    logger.info(`MongoDB connecting (${mode} mode)...`);
    return mongoose.connect(uri, options);
  };

  try {
    let conn;
    try {
      conn = await tryConnect(false);
    } catch (error) {
      if (isSrvLookupError(error)) {
        logger.warn(
          'MongoDB SRV DNS lookup failed — retrying with direct connection. '
          + 'Set MONGODB_DNS_SRV=false in .env to skip SRV permanently.'
        );
        conn = await tryConnect(true);
      } else {
        throw error;
      }
    }

    logger.info(`MongoDB Connected: ${conn.connection.host} (database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    if (error.message?.includes('Authentication failed')) {
      logger.error(
        'MongoDB authentication failed. Check MONGODB_URI credentials in backend/.env.'
      );
    } else if (isSrvLookupError(error)) {
      logger.error(
        'MongoDB DNS/SRV lookup failed. Try in backend/.env:\n'
        + '  MONGODB_DNS_SRV=false\n'
        + '  MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1\n'
        + 'Or paste Atlas "Standard connection string" into MONGODB_URI_DIRECT.'
      );
    }
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
