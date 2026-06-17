require('../src/config/loadEnv');

const { applyCorsHeaders, handleOptions, sendJson } = require('./cors');

let handlerPromise;

const bootHandler = () => {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const connectDB = require('../src/config/database');
      const serverless = require('serverless-http');
      const app = require('../src/app');

      await connectDB();

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
