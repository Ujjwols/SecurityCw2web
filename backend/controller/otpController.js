const OTP = require('../model/otpModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');

const sendOTPController = asyncHandler(async ({ identifier }) => {
  console.log("sendOTPController input:", { identifier });

  if (!identifier) {
    throw new ApiError(400, 'Email identifier is required');
  }

  await OTP.deleteMany({ email: identifier.toLowerCase() });

  const otp = generateOTP();

  try {
    await sendEmail({
      to: identifier,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
      html: `<strong>Your OTP code is ${otp}. It will expire in 5 minutes.</strong>`,
    });
  } catch (error) {
    console.error("Email send error:", error);
    throw new ApiError(500, 'Failed to send OTP email');
  }

  const otpRecord = await OTP.create({
    email: identifier.toLowerCase(),
    token: otp,
    expiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  console.log("OTP record stored:", otpRecord);

  return {
    token: otp,
    identifier,
    message: 'OTP sent successfully via email',
  };
});

const verifyOTPController = asyncHandler(async ({ token, otp }) => {
  console.log("verifyOTPController input:", { token, otp });

  if (!token || !otp) {
    throw new ApiError(400, 'Token and OTP are required');
  }

  const otpRecord = await OTP.findOne({ token });
  if (!otpRecord) {
    throw new ApiError(404, 'OTP not found or already used/expired');
  }

  if (otpRecord.token !== otp) {
    await OTP.findByIdAndDelete(otpRecord._id);
    throw new ApiError(400, 'Invalid OTP');
  }

  if (otpRecord.expiry < new Date()) {
    await OTP.findByIdAndDelete(otpRecord._id);
    throw new ApiError(400, 'OTP has expired');
  }

  const identifier = otpRecord.email;

  await OTP.findByIdAndDelete(otpRecord._id);

  return {
    identifier,
    message: 'OTP verified successfully',
  };
});

module.exports = { sendOTPController, verifyOTPController };