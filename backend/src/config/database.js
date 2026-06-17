const mongoose = require('mongoose');
const logger = require('../utils/logger');
const {
  resolveMongoUri,
  getMongoConnectOptions,
  isSrvLookupError,
} = require('./mongodbUri');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (isServerless) {
  mongoose.set('bufferCommands', false);
}

const assertProductionMongoUri = async () => {
  if (!isServerless) return;

  const uri = await resolveMongoUri();
  if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
    throw new Error(
      'MONGODB_URI is not set on Vercel. Add MONGODB_URI and MONGODB_URI_DIRECT in Project → Settings → Environment Variables.'
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
      const uri = await resolveMongoUri({ forceDirect });
      const mode = forceDirect || uri.startsWith('mongodb://') ? 'direct' : 'srv';
      logger.info(`MongoDB connecting (${mode} mode)...`);
      return mongoose.connect(uri, options);
    };

    try {
      const preferDirect = isServerless || process.env.MONGODB_DNS_SRV === 'false';
      const conn = await tryConnect(preferDirect);

      logger.info(`MongoDB Connected: ${conn.connection.host} (database: ${conn.connection.name})`);
      return conn;
    } catch (error) {
      if (!isServerless && isSrvLookupError(error)) {
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
          'MongoDB DNS failed on Vercel. Set MONGODB_URI_DIRECT to the Atlas standard connection string (run: npm run mongo:direct-uri).'
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
