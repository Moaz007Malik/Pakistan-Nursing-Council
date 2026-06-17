const mongoose = require('mongoose');
const logger = require('../utils/logger');
const {
  resolveMongoUri,
  getMongoConnectOptions,
  isSrvLookupError,
  prefersDirectConnection,
} = require('./mongodbUri');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (isServerless) {
  mongoose.set('bufferCommands', false);
}

const assertProductionMongoUri = async () => {
  const { uri } = await resolveMongoUri({ forceDirect: prefersDirectConnection() || isServerless });
  const isRemote = process.env.NODE_ENV === 'production' || isServerless;

  if (isRemote && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    throw new Error(
      'MONGODB_URI is missing or points to localhost. Set MONGODB_URI to your Atlas connection string.'
    );
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (global.__mongooseConnPromise) {
    return global.__mongooseConnPromise;
  }

  global.__mongooseConnPromise = (async () => {
    await assertProductionMongoUri();

    const options = getMongoConnectOptions();

    const tryConnect = async (forceDirect = false) => {
      const { uri, source, mode } = await resolveMongoUri({ forceDirect });
      logger.info(`MongoDB connecting (${mode} mode via ${source})...`);
      return mongoose.connect(uri, options);
    };

    try {
      const useDirect = isServerless || prefersDirectConnection();
      const conn = await tryConnect(useDirect);

      logger.info(`MongoDB Connected: ${conn.connection.host} (database: ${conn.connection.name})`);
      return conn;
    } catch (error) {
      if (!isServerless && !prefersDirectConnection() && isSrvLookupError(error)) {
        logger.warn('MongoDB SRV failed — retrying with direct connection.');
        const conn = await tryConnect(true);
        logger.info(`MongoDB Connected: ${conn.connection.host} (database: ${conn.connection.name})`);
        return conn;
      }

      global.__mongooseConnPromise = null;

      if (error.message?.includes('Authentication failed')) {
        logger.error('MongoDB authentication failed. Check MONGODB_URI credentials.');
      } else if (isSrvLookupError(error)) {
        logger.error(
          'MongoDB DNS failed. Set MONGODB_DNS_SRV=false and MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 on Vercel.'
        );
      }

      logger.error(`MongoDB connection error: ${error.message}`);

      if (isServerless) {
        throw error;
      }

      process.exit(1);
    }
  })();

  return global.__mongooseConnPromise;
};

module.exports = connectDB;
