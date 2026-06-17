const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { applyCorsHeaders, handleOptions, sendJson } = require('./cors');

const getPath = (req) => String(req.url || '').split('?')[0];

let handlerPromise;

const bootHandler = () => {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const connectDB = require('../src/config/database');
      const serverless = require('serverless-http');

      const [, app] = await Promise.all([
        connectDB(),
        Promise.resolve().then(() => require('../src/app.serverless')),
      ]);

      return serverless(app, {
        binary: ['multipart/*', 'application/pdf', 'image/*'],
      });
    })().catch((error) => {
      handlerPromise = null;
      throw error;
    });
  }

  return handlerPromise;
};

if (process.env.VERCEL) {
  bootHandler().catch(() => {});
}

module.exports = async (req, res) => {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  const routePath = getPath(req);

  if ((routePath === '/api' || routePath === '/api/') && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      name: 'PNMC API',
      docs: '/api/docs',
      health: '/health',
    });
    return;
  }

  try {
    const handler = await bootHandler();
    return handler(req, res);
  } catch (error) {
    console.error('API boot failed:', error.message);
    sendJson(res, 503, {
      success: false,
      message: error.message || 'Service unavailable',
    });
  }
};
