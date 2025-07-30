const winston = require('winston');
const { format } = require('date-fns');
const Log = require('../model/logModel');

// Custom Winston transport for Mongoose
class MongooseTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.model = Log;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const logEntry = {
      timestamp: info.meta.timestamp,
      username: info.meta.username,
      method: info.meta.method,
      url: info.meta.url,
      status: info.meta.status,
      ip: info.meta.ip,
      responseBody: info.meta.responseBody,
    };

    this.model.create(logEntry).catch((error) => {
      console.error('Error saving log to MongoDB:', error);
    });

    callback();
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new MongooseTransport()],
});

const winstonLogger = async (req, res, next) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];

  res.write = function (chunk) {
    chunks.push(Buffer.from(chunk));
    oldWrite.apply(res, arguments);
  };

  res.end = async function (chunk) {
    if (chunk) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString('utf8');
    const statusCode = res.statusCode;

    let parsedBody;

    try {
      parsedBody = body && body !== 'null' ? JSON.parse(body) : {};
    } catch (err) {
      // If it's not JSON, just keep it as a raw string
      parsedBody = body;
    }

    // Optional: Remove sensitive fields
    if (parsedBody && typeof parsedBody === 'object') {
      if (parsedBody.password) delete parsedBody.password;
      if (parsedBody.token) delete parsedBody.token;
    }

    const logEntry = {
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      username: req.user ? req.user.username : 'unauthenticated',
      method: req.method,
      url: req.originalUrl || req.url,
      status: statusCode,
      ip: req.ip,
      responseBody: parsedBody,
    };

    try {
      logger.info('User Activity', { meta: logEntry });
    } catch (error) {
      console.error('Error logging with Winston:', error);
    }

    oldEnd.apply(res, arguments);
  };

  next();
};

module.exports = winstonLogger;
