const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/database');
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

// No database required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'PNMC API',
    docs: '/api/docs',
    health: '/health',
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const apiRouter = express.Router();

apiRouter.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: error.message || 'Database connection failed',
    });
  }
});

apiRouter.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  return apiLimiter(req, res, next);
});

apiRouter.use(routes);

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
