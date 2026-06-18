const logger = require('../utils/logger');
const { connectDB: connectJsonStore, getConnectionState, DATA_DIR } = require('../lib/jsonStore');

const connectDB = async () => {
  try {
    const result = await connectJsonStore();
    logger.info(`JSON database ready at ${result.dir}`);
    return result;
  } catch (error) {
    logger.error(`JSON database error: ${error.message}`);
    throw error;
  }
};

connectDB.getConnectionState = getConnectionState;
connectDB.DATA_DIR = DATA_DIR;

module.exports = connectDB;
