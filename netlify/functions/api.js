require('../../src/server/config/loadEnv');

const serverless = require('serverless-http');

let handlerPromise;

const bootHandler = () => {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const connectDB = require('../../src/server/config/database');
      const app = require('../../src/server/app');
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

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const handler = await bootHandler();
    return handler(event, context);
  } catch (error) {
    console.error('API boot failed:', error.message);
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Service unavailable',
      }),
    };
  }
};
