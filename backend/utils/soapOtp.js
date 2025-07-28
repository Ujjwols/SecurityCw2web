require('dotenv').config();
const soap = require('soap');
const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const {
  NTC_WSDL_URL,
  NTC_USERNAME,
  NTC_PASSWORD,
  NTC_BUSICODE,
  OTP_SECRET_KEY,
  OTP_TOKEN_EXPIRY,
} = process.env;

let clientPromise;

async function getClient() {
  if (!clientPromise) {
    clientPromise = soap
      .createClientAsync(NTC_WSDL_URL)
      .then((client) => {
        client.addSoapHeader(
          { AuthHeader: { Username: NTC_USERNAME, Password: NTC_PASSWORD } },
          '',
          'tns',
          'NepalTelecom.AuthGateway'
        );
        return client;
      })
      .catch((error) => {
        console.error('SOAP Client Creation Error:', error);
        throw new ApiError(500, 'Failed to initialize SOAP client');
      });
  }
  return clientPromise;
}

async function requestOtp(mdn) {
  try {
    if (!mdn) {
      throw new ApiError(400, 'Mobile number is required');
    }
    const client = await getClient();
    const [res] = await client.GenerateAuthPasswordAsync({
      MDN: mdn,
      Busicode: NTC_BUSICODE,
    });
    const { ResultCode: code, GenerateAuthPasswordResult: trId } = res;

    if (code !== '0' && code !== '00') {
      console.error('NTC OTP Request Failed:', { code, trId });
      throw new ApiError(400, 'Failed to send OTP');
    }

    const token = jwt.sign(
      { mdn, trId },
      OTP_SECRET_KEY,
      { expiresIn: OTP_TOKEN_EXPIRY }
    );

    return { success: true, token, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('NTC OTP Request Error:', error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, 'Internal error while sending OTP');
  }
}

async function confirmOtp(token, otp) {
  try {
    if (!token || !otp) {
      throw new ApiError(400, 'Token and OTP are required');
    }
    const { mdn, trId } = jwt.verify(token, OTP_SECRET_KEY);

    const client = await getClient();
    const [res] = await client.ValidateOTPAsync({
      MDN: mdn,
      BusiCode: NTC_BUSICODE,
      OTP: otp,
      TrId: trId,
    });

    const code = res.ValidateOTPResult;
    const success = code === '0' || code === '00';

    if (!success) {
      console.error('NTC OTP Verification Failed:', { code, mdn, trId });
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    return { success: true, mdn, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('NTC OTP Verification Error:', error);
    throw error instanceof ApiError
      ? error
      : new ApiError(401, 'Invalid or expired token or OTP');
  }
}

module.exports = { requestOtp, confirmOtp };