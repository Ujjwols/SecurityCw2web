const OTP = require('../model/otpModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { requestOtp, confirmOtp } = require('../utils/soapOtp');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');

const sendOTPController = asyncHandler(async ({ identifier, deliveryMethod }) => {
  console.log("sendOTPController input:", { identifier, deliveryMethod });

  if (!identifier || !deliveryMethod) {
    throw new ApiError(400, 'Identifier and delivery method are required');
  }
  if (!['sms', 'email'].includes(deliveryMethod)) {
    throw new ApiError(400, 'Invalid delivery method. Use "sms" or "email"');
  }

  // Delete previous OTPs/tokens for this identifier
  const query =
    deliveryMethod === 'sms' ? { mobileNumber: identifier } : { email: identifier };
  await OTP.deleteMany(query);

  let token;
  let message;

  if (deliveryMethod === 'sms') {
    console.log("Sending SMS OTP to:", identifier);
    const { success, token: jwtToken, message: smsMessage } = await requestOtp(identifier);
    if (!success) {
      console.log("SMS OTP request failed:", smsMessage);
      throw new ApiError(400, smsMessage);
    }
    token = jwtToken;
    message = smsMessage;
  } else {
    const otp = generateOTP();
    console.log("Sending email OTP:", { to: identifier, otp });
    try {
      await sendEmail({
        to: identifier,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        html: `<strong>Your OTP code is ${otp}. It will expire in 5 minutes.</strong>`,
      });
      token = otp;
      message = 'OTP sent successfully via email';
    } catch (error) {
      console.error("Email send error:", error);
      throw new ApiError(500, 'Failed to send OTP email');
    }
  }

  // Store OTP/token in MongoDB
  console.log("Storing OTP record:", { identifier, token, deliveryMethod });
  const otpRecord = await OTP.create({
    [deliveryMethod === 'sms' ? 'mobileNumber' : 'email']: identifier,
    token,
    deliveryMethod,
    expiry: new Date(Date.now() + 5 * 60 * 1000), // Explicit 5-minute expiry
  });
  console.log("OTP record stored:", otpRecord);

  return {
    token,
    identifier,
    deliveryMethod,
    message,
  };
});


const verifyOTPController = asyncHandler(async ({ token, otp, deliveryMethod }) => {
  console.log("verifyOTPController input:", { token, otp, deliveryMethod });

  if (!token || !otp || !deliveryMethod) {
    throw new ApiError(400, 'Token, OTP, and delivery method are required');
  }
  if (!['sms', 'email'].includes(deliveryMethod)) {
    throw new ApiError(400, 'Invalid delivery method. Use "sms" or "email"');
  }

  // Find OTP/token record
  const otpRecord = await OTP.findOne({ token, deliveryMethod });
  if (!otpRecord) {
    console.log("No OTP record found:", { token, deliveryMethod });
    throw new ApiError(404, 'Token/OTP not found or expired');
  }

  let identifier;
  let message;

  if (deliveryMethod === 'sms') {
    console.log("Verifying SMS OTP:", { token, otp });
    const { success, mdn, message: smsMessage } = await confirmOtp(token, otp);
    if (!success) {
      console.log("SMS OTP verification failed:", smsMessage);
      await OTP.findByIdAndDelete(otpRecord._id);
      throw new ApiError(400, smsMessage);
    }
    identifier = mdn;
    message = smsMessage;
  } else {
    console.log("Verifying email OTP:", { stored: otpRecord.token, provided: otp });
    if (otpRecord.token !== otp) {
      await OTP.findByIdAndDelete(otpRecord._id);
      throw new ApiError(400, 'Invalid OTP');
    }
    if (otpRecord.expiry < new Date()) {
      await OTP.findByIdAndDelete(otpRecord._id);
      throw new ApiError(400, 'OTP has expired');
    }
    identifier = otpRecord.email;
    message = 'OTP verified successfully';
  }

  // Delete OTP/token after successful verification
  await OTP.findByIdAndDelete(otpRecord._id);

  return {
    identifier,
    deliveryMethod,
    message,
  };
});

module.exports = { sendOTPController, verifyOTPController };