const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    timestamp: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: 'unauthenticated',
    },
    method: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    responseBody: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for performance
logSchema.index({ timestamp: -1 });
logSchema.index({ username: 1 });
// Optional: TTL for 90-day retention
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Log', logSchema);