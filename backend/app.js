const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  process.env.USER_CORS_ORIGIN || 'http://localhost:5173',
].filter(Boolean);

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

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later',
});
app.use('/api/v1/user/login', authLimiter);
app.use('/api/v1/user/refresh-token', authLimiter);

app.use(
  morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  })
);

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
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-frontend'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log('Response headers:', res.getHeaders());
  });
  next();
});

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

const userRouter = require('./routes/userRoutes');
app.use('/api/v1/user', userRouter);

app.use((err, req, res, next) => {
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