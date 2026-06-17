const mongoose = require('mongoose');
const logger = require('../utils/logger');
const {
  resolveMongoUri,
  getMongoConnectOptions,
  isSrvLookupError,
} = require('./mongodbUri');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const assertProductionMongoUri = async () => {
  if (!isServerless) return;

  const uri = await resolveMongoUri();
  if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
    throw new Error(
      'MONGODB_URI is not set on the server. Add it in Vercel → Project → Settings → Environment Variables.'
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
      let conn;
      try {
        conn = await tryConnect(false);
      } catch (error) {
        if (isSrvLookupError(error)) {
          logger.warn(
            'MongoDB SRV DNS lookup failed — retrying with direct connection. '
            + 'Set MONGODB_DNS_SRV=false on the server to skip SRV permanently.'
          );
          conn = await tryConnect(true);
        } else {
          throw error;
        }
      }

      logger.info(`MongoDB Connected: ${conn.connection.host} (database: ${conn.connection.name})`);
      return conn;
    } catch (error) {
      global.__mongooseConnPromise = null;

      if (error.message?.includes('Authentication failed')) {
        logger.error('MongoDB authentication failed. Check MONGODB_URI credentials.');
      } else if (isSrvLookupError(error)) {
        logger.error(
          'MongoDB DNS/SRV lookup failed. Set MONGODB_DNS_SRV=false and MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 on the server.'
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
