const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
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
  if (getAllowedOrigins().includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    if (/\.vercel\.app$/i.test(hostname)) return true;
  } catch {
    return false;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ success: true, name: 'PNMC API', health: '/health' });
});

const apiRouter = express.Router();
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
