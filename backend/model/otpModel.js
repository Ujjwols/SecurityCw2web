  const mongoose = require('mongoose');

  const otpSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
      expiry: {
        type: Date,
        required: true,
      },
    },
    { timestamps: true }
  );

  // Auto-delete expired records
  otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

  module.exports = mongoose.model('Otp', otpSchema);
