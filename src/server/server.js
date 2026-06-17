const app = require('./app');
const connectDB = require('./config/database');
const config = require('./config');
const logger = require('./utils/logger');

const startServer = async () => {
  await connectDB();

  app.listen(config.port, '0.0.0.0', () => {
    logger.info(`PNMC API running on http://0.0.0.0:${config.port} [${config.env}]`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
