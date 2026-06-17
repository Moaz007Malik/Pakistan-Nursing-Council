const INIT_TIMEOUT_MS = 9000;

let handler;
let initPromise;

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const allowed = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
  ].filter(Boolean);
  if (allowed.includes(origin)) return true;
  try {
    return /\.vercel\.app$/i.test(new URL(origin).hostname);
  } catch {
    return false;
  }
};

const applyCorsHeaders = (req, res) => {
  const { origin } = req.headers;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
};

const getPath = (req) => String(req.url || '').split('?')[0];

const sendJson = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
};

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  }),
]);

const initializeHandler = () => {
  if (!initPromise) {
    initPromise = withTimeout(
      (async () => {
        const connectDB = require('../backend/src/config/database');
        const serverless = require('serverless-http');
        const [, app] = await Promise.all([
          connectDB(),
          Promise.resolve().then(() => require('../backend/src/app.serverless')),
        ]);
        return serverless(app, { binary: ['multipart/*', 'application/pdf', 'image/*'] });
      })(),
      INIT_TIMEOUT_MS,
      'API cold start timed out. Set MONGODB_URI_DIRECT on Vercel.'
    ).catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
};

module.exports = async (req, res) => {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Requested-With'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }

  const path = getPath(req);

  if (path === '/health' || path === '/health/') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  if ((path === '/api' || path === '/api/') && req.method === 'GET') {
    sendJson(res, 200, { success: true, name: 'PNMC API', docs: '/api/docs', health: '/health' });
    return;
  }

  try {
    handler = handler || await initializeHandler();
    return handler(req, res);
  } catch (error) {
    console.error('API initialization failed:', error.message);
    sendJson(res, 503, { success: false, message: error.message || 'Service unavailable' });
  }
};
