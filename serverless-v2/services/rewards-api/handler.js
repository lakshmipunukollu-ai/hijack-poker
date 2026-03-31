'use strict';

const express = require('express');
const serverless = require('serverless-http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const healthRoute = require('./src/routes/health');
const publicRoute = require('./src/routes/public');
const authRoute = require('./src/routes/auth');
const pointsRoute = require('./src/routes/points');
const playerRoute = require('./src/routes/player');
const adminRoute = require('./src/routes/admin');
const { authMiddleware } = require('./src/middleware/auth');

const app = express();

// Security headers — first middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'http://localhost:5000'],
      imgSrc: ["'self'", 'data:'],
      frameSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'same-origin' },
  noSniff: true,
  xssFilter: true,
}));

app.use(express.json({ limit: '10kb' })); // Prevent oversized payloads

// CORS — production: explicit ALLOWED_ORIGINS; local/staging: localhost + 127.0.0.1 (any port).
const isLocalOrNonProd =
  process.env.STAGE === 'local' ||
  process.env.NODE_ENV !== 'production';
const ALLOWED_ORIGINS = isLocalOrNonProd
  ? [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/]
  : (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = origin && ALLOWED_ORIGINS.some((o) =>
    typeof o === 'string' ? o === origin : o.test(origin),
  );
  if (allowed) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Vary', 'Origin');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Api-Key, X-Amz-Date, X-Amz-Security-Token',
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const isLocalStage = process.env.STAGE === 'local';

// Rate limiters — local (Docker serverless offline) gets generous limits so
// "Seed Demo Data" (20 rapid POSTs) and manual testing do not hit 429.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isLocalStage ? 8000 : (process.env.NODE_ENV === 'production' ? 200 : 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isLocalStage ? 500 : 10,
  message: { error: 'Too many auth attempts' },
});
// In STAGE=local (Docker / serverless offline), do not throttle awards — dev seeding and Play Hand are expected.
const pointsAwardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  skip: () => isLocalStage,
  message: { error: 'Point award rate limit exceeded' },
});

app.use(globalLimiter);

// Routes
app.use('/api/v1/health', healthRoute);
app.use('/api/v1', publicRoute);
app.use('/api/v1/auth', authLimiter, authRoute);
app.use('/api/v1/points/award', pointsAwardLimiter); // extra limiter before auth
app.use('/api/v1/points', authMiddleware, pointsRoute);
app.use('/api/v1/player', authMiddleware, playerRoute);
app.use('/api/v1/admin', adminRoute); // adminAuthMiddleware applied inside admin routes

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  if (err && err.isDatabaseUnavailable) {
    return res.status(503).json({ error: 'Database unavailable - is DynamoDB Local running?' });
  }
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Internal server error' });
});

module.exports.app = app;
module.exports.api = serverless(app);
