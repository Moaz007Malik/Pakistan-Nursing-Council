const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const ensureDb = require('./middleware/ensureDb');
const connectDB = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config');

const app = express();

app.set('trust proxy', 1);

const getAllowedOrigins = () => [
  config.frontendUrl,
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (/\.vercel\.app$/i.test(hostname)) return true;
    if (config.env === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (error) {
      return res.status(503).json({
        status: 'error',
        db: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.json({
    status: 'ok',
    db: states[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'PNMC API',
    health: '/health',
  });
});

let apiRouter;
const getApiRouter = () => {
  if (!apiRouter) {
    apiRouter = express.Router();
    apiRouter.use((req, res, next) => {
      if (req.method === 'OPTIONS') return next();
      return apiLimiter(req, res, next);
    });
    apiRouter.use(require('./routes'));
  }
  return apiRouter;
};

app.use('/api', ensureDb);
app.use('/api', (req, res, next) => getApiRouter()(req, res, next));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
