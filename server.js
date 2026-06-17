require('./src/server/config/loadEnv');

const { parse } = require('url');
const express = require('express');
const next = require('next');
const apiApp = require('./src/server/app');
const connectDB = require('./src/server/config/database');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

const start = async () => {
  await connectDB();
  await nextApp.prepare();

  const server = express();

  server.use((req, res, nextMiddleware) => {
    const urlPath = req.path || req.url?.split('?')[0] || '';
    if (urlPath === '/health' || urlPath.startsWith('/api')) {
      return apiApp(req, res);
    }
    return nextMiddleware();
  });

  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, () => {
    console.log(`PNMC running on http://localhost:${port} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
