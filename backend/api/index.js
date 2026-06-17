const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let handler;

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const allowed = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ...(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ].filter(Boolean);

  if (allowed.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (/\.vercel\.app$/i.test(hostname)) return true;
    if (process.env.NODE_ENV !== 'production' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
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

  // Instant responses — never load Express/Mongoose (prevents Vercel 10s timeout).
  if (path === '/health' || path === '/health/') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  if ((path === '/api' || path === '/api/') && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      name: 'PNMC API',
      docs: '/api/docs',
      health: '/health',
    });
    return;
  }

  if (!handler) {
    const serverless = require('serverless-http');
    const app = require('../src/app');
    handler = serverless(app, {
      binary: ['multipart/*', 'application/pdf', 'image/*'],
    });
  }

  return handler(req, res);
};
