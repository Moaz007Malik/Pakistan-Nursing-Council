const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');
const config = require('./config');
const logger = require('./utils/logger');
const { initializeSocket } = require('./socket');

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.frontendUrl, credentials: true },
  });

  initializeSocket(io);
  app.set('io', io);

  server.listen(config.port, '0.0.0.0', () => {
    logger.info(`PNMC API running on http://0.0.0.0:${config.port} [${config.env}]`);
    logger.info(`Swagger docs: http://localhost:${config.port}/api/docs`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
