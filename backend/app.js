const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const morgan = require('morgan');
const csrfProtection = require('./middleware/csrfProtection');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const winstonLogger = require('./middleware/winstonLogger');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'https://localhost:3000',
  process.env.USER_CORS_ORIGIN || 'https://192.168.166.1:5173',
].filter(Boolean);

// 1. CORS middleware — must be before other middleware that sends responses
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.error(`CORS error: Origin ${origin} not allowed`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-frontend',
      'X-CSRF-Token',
      'x-csrf-token',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  })
);

// 2. Other security and utility middleware
app.use(cookieParser());

app.use(
  helmet({
    contentSecurityPolicy: false,
    xFrameOptions: { action: 'deny' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(
  expressCspHeader({
    directives: {
      'default-src': [SELF],
      'script-src': [SELF, INLINE],
      'style-src': [SELF, INLINE],
      'img-src': [SELF, 'data:'],
      'connect-src': [SELF, ...allowedOrigins],
      'frame-src': [NONE],
      'object-src': [NONE],
    },
  })
);

// 3. Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later',
});
app.use('/api/v1/user/send-otp', authLimiter);
app.use('/api/v1/user/verify-otp', authLimiter); // fixed missing slash
app.use('/api/v1/user/refresh-token', authLimiter);
app.use('/api/v1/user/update-password', authLimiter);

// 4. Logging middleware
app.use(
  morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  })
);

app.use(winstonLogger);

// 5. Body parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// 6. Sanitization middleware
app.use((req, res, next) => {
  const sanitize = (obj, fieldsToSanitize) => {
    if (!obj) return;
    for (const key in obj) {
      if (
        fieldsToSanitize.includes(key) &&
        typeof obj[key] === 'string'
      ) {
        const original = obj[key];
        obj[key] = mongoSanitize.sanitize(obj[key]);
        obj[key] = xss(obj[key]);
        if (original !== obj[key]) {
          console.log(`Sanitized ${key}: "${original}" -> "${obj[key]}"`);
        }
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key], fieldsToSanitize);
      }
    }
  };

  const fieldsToSanitize = ['username', 'title', 'description', 'location'];
  sanitize(req.body, fieldsToSanitize);
  sanitize(req.query, fieldsToSanitize);
  sanitize(req.params, fieldsToSanitize);

  next();
});

// 7. Serve static files
app.use(express.static('public'));

// 8. CSRF token route
app.use('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 9. API routes
const userRouter = require('./routes/userRoutes');
const eventRouter = require('./routes/eventRoutes');
const paymentRouter = require('./routes/paymentRoutes');
app.use('/api/v1/user', userRouter);
app.use('/api/v1/event', eventRouter);
app.use('/api/v1/payment', paymentRouter);

// 10. Error handling middleware (at the very end)
app.use((err, req, res, next) => {
  // Ensure CORS headers even on error
  res.header(
    'Access-Control-Allow-Origin',
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : ''
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('Error in request:', {
    error: message,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;
