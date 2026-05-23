const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const swaggerSpec    = require('./config/swagger');
const errorHandler   = require('./middleware/errorHandler');
const { sequelize }  = require('./config/database');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// Swagger UI needs unsafe-inline for its scripts and styles; allow only on the docs path.
app.use('/api/v1/docs', (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  );
  next();
});
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// In test mode the limits are raised high so the test suite never gets throttled.
const isTest = process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

app.use('/api', globalLimiter);
app.set('authLimiter', authLimiter); // accessible in route files via app.get('authLimiter')

// ── Logging ───────────────────────────────────────────────────────────────────
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Body parsing ──────────────────────────────────────────────────────────────
// Error #15: the Razorpay webhook route needs the raw Buffer for signature verification.
// Applying express.json() globally would consume the body stream first, making the
// raw body unavailable to the route-level express.raw() middleware.
// Solution: skip express.json() for the webhook path; the route handles its own parsing.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/donations/webhook') return next();
  return express.json({ limit: '10kb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── API Documentation ─────────────────────────────────────────────────────────
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'GiveHope API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// Serve the raw OpenAPI JSON spec (useful for tooling)
app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/v1/health', async (req, res) => {
  let dbConnected = false;
  try {
    await sequelize.authenticate();
    dbConnected = true;
  } catch (_) { /* db unreachable — return false, don't throw */ }

  res.json({
    success:     true,
    status:      'ok',
    uptime:      Math.floor(process.uptime()),
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
    dbConnected,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authLimiter, require('./routes/auth.routes'));
app.use('/api/v1/users',         require('./routes/user.routes'));
app.use('/api/v1/charities',     require('./routes/charity.routes'));
app.use('/api/v1/donations',     require('./routes/donation.routes'));
app.use('/api/v1/admin',         require('./routes/admin.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));

// ── 404 ───────────────────────────────────────────────────────────────────────
// Express 5 dropped support for '*' as a wildcard path; omit the path for a catch-all.
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
