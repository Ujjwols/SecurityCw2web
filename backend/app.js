const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');

const app = express();

// Define allowed origins with fallback
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  process.env.USER_CORS_ORIGIN || 'http://localhost:5173',
].filter(Boolean);

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      console.log('Request origin:', origin);
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

// Debug: Log response headers
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

// Routers
const userRouter = require('./routes/userRoutes');
;

app.use('/api/v1/user', userRouter);


// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('Error in request:', err);
  res.status(statusCode).json({ success: false, message, statusCode });
});

module.exports = app;
