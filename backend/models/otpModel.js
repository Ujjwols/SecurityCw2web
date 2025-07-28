const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: function () {
        return this.deliveryMethod === 'sms';
      },
    },
    email: {
      type: String,
      required: function () {
        return this.deliveryMethod === 'email';
      },
    },
    token: {
      type: String, // JWT token for SMS, OTP for email
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ['sms', 'email'],
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Automatically delete expired OTPs/tokens
otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

otpSchema.pre('validate', function (next) {
  if (!this.expiry) {
    const expiryTimeMs = 5 * 60 * 1000; // 5 minutes
    this.expiry = new Date(Date.now() + expiryTimeMs);
  }
  next();
});

module.exports = mongoose.model('Otp', otpSchema);