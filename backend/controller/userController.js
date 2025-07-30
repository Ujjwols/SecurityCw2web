const asyncHandler = require("../utils/asyncHandler");
const User = require("../model/userModel");
const Log = require("../model/logModel");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { sendOTPController, verifyOTPController } = require("../controller/otpController");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const cloudinary = require("cloudinary").v2;
const { redisClient } = require("../utils/redisClient");
const ms =require("ms");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    if (user.refreshToken) {
      await redisClient.set(`blacklist:${user.refreshToken}`, 'true', 'EX', parseInt(process.env.REFRESH_TOKEN_EXPIRY));
    }
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUserController = asyncHandler(async (req, res) => {
  await Promise.all([
    body('username').trim().escape().isLength({ min: 3 }).withMessage('Username must be at least 3 characters').run(req),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format').run(req),
    body('password').matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/)
      .withMessage('Password must be at least 6 characters with one capital letter, one number, and one special character').run(req),
  ]);

  console.log('Request body:', req.body); // Log for debugging
  console.log('Request files:', req.files);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map(err => err.msg).join('; '));
  }

  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    throw new ApiError(400, "Email must be a valid Gmail address");
  }

  let profilePicUrl = "";
  if (req.files?.profilePic) {
    try {
      const profilePicResult = await uploadOnCloudinary(
        req.files.profilePic[0].path,
        "User Profiles"
      );
      if (profilePicResult && profilePicResult.secure_url) {
        profilePicUrl = profilePicResult.secure_url;
      } else {
        throw new ApiError(500, "Failed to upload profile picture");
      }
    } catch (error) {
      throw new ApiError(500, `Profile picture upload failed: ${error.message}`);
    }
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    profilePic: profilePicUrl,
    passwordHistory: [{ password: await bcrypt.hash(password, 10), createdAt: new Date() }],
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken -passwordHistory");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const sendOTPVerificationLogin = asyncHandler(async (req, res) => {
  
  await Promise.all([
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format').run(req),
    body('password').notEmpty().withMessage('Password is required').run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map(err => err.msg).join('; '));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  if (req.headers["x-admin-frontend"] === "true" && user.role !== "admin") {
    throw new ApiError(403, "Not an admin user from this frontend");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid password");
  }

  const identifier = user.email;
  try {
    const { token, identifier: returnedIdentifier, message } =
      await sendOTPController({ identifier });

    return res
      .status(200)
      .json(new ApiResponse(200, { token, identifier: returnedIdentifier }, message));
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message || "Failed to send OTP");
  }
});

const verifyUserOTPLogin = asyncHandler(async (req, res) => {
  await Promise.all([
    body('token').notEmpty().withMessage('Token is required').run(req),
    body('otp').notEmpty().withMessage('OTP is required').run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map(err => err.msg).join('; '));
  }

  const { token, otp } = req.body;

  try {
    const { identifier, message } = await verifyOTPController({
      token,
      otp,
    });

    const user = await User.findOne({ email: identifier.toLowerCase() });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (req.headers["x-admin-frontend"] === "true" && user.role !== "admin") {
      throw new ApiError(403, "This interface is for admin users only");
    }

    const passwordAgeDays = Math.floor(
      (new Date().getTime() - new Date(user.passwordLastReset).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (passwordAgeDays > 90) {
      return res.status(200).json(
        new ApiResponse(200, { needsPasswordUpdate: true, userId: user._id }, "Password update required")
      );
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -passwordHistory");

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
    };

    const refreshOptions = {
      ...options,
      maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, refreshOptions)
      .json(
        new ApiResponse(
          200,
          { loggedInUser, accessToken, refreshToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.error("Error in verifyUserOTPLogin:", error);
    throw error;
  }
});

const updatePasswordController = asyncHandler(async (req, res) => {
  await Promise.all([
    body('currentPassword').notEmpty().withMessage('Current password is required').run(req),
    body('newPassword')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/)
      .withMessage('New password must be at least 6 characters with one capital letter, one number, and one special character')
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map(err => err.msg).join('; '));
  }

  const { userId, currentPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.passwordAttempts >= 3) {
    throw new ApiError(429, "Maximum password update attempts reached for this session");
  }

  const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isCurrentPasswordValid) {
    user.passwordAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "Current password is incorrect");
  }

  const isPasswordReused = await user.isPasswordInHistory(newPassword);
  if (isPasswordReused) {
    user.passwordAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "New password cannot be the same as the previous two passwords");
  }

  user.password = newPassword;
  user.passwordHistory.push({ password: await bcrypt.hash(newPassword, 10), createdAt: new Date() });
  user.passwordLastReset = new Date();
  user.passwordAttempts = 0;
  if (user.refreshToken) {
    await redisClient.set(`blacklist:${user.refreshToken}`, 'true', 'EX', parseInt(process.env.REFRESH_TOKEN_EXPIRY));
    user.refreshToken = null;
  }
  if (user.passwordHistory.length > 3) {
    user.passwordHistory = user.passwordHistory.slice(-3);
  }
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findById(decodedToken._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const isBlacklisted = await redisClient.get(`blacklist:${incomingRefreshToken}`);
    if (isBlacklisted) {
      throw new ApiError(401, "Refresh token has been revoked");
    }

    console.log(`Refresh token used: userId=${decodedToken._id}, ip=${req.ip}, time=${new Date().toISOString()}`);

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY) ,
    };

    const refreshOptions = {
      ...options,
      maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, refreshOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

const logoutUserController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "No refresh token found");
  }

  const user = await User.findOne({ refreshToken });
  if (user) {
    await redisClient.set(`blacklist:${refreshToken}`, 'true', 'EX', parseInt(process.env.REFRESH_TOKEN_EXPIRY));
    await redisClient.set(`blacklist:${req.cookies.accessToken}`, 'true', 'EX', parseInt(process.env.ACCESS_TOKEN_EXPIRY));
    user.refreshToken = null;
    user.passwordAttempts = 0;
    await user.save({ validateBeforeSave: false });
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUserController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -passwordHistory");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user retrieved successfully"));
});

const getAllUsersController = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const users = await User.find(query).select("-password -refreshToken -passwordHistory");

  if (!users || users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully"));
});

const getUserByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password -refreshToken -passwordHistory");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User retrieved successfully"));
});

const updateUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  delete updateData.password;
  delete updateData.refreshToken;
  delete updateData.role;
  delete updateData.passwordHistory;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (req.files?.profilePic) {
    try {
      if (user.profilePic) {
        const publicId = user.profilePic.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`User Profiles/${publicId}`);
      }
      const profilePicResult = await uploadOnCloudinary(
        req.files.profilePic[0].path,
        "User Profiles"
      );
      if (profilePicResult && profilePicResult.secure_url) {
        user.profilePic = profilePicResult.secure_url;
      } else {
        throw new ApiError(500, "Failed to upload profile picture");
      }
    } catch (error) {
      throw new ApiError(500, `Profile picture upload failed: ${error.message}`);
    }
  }

  Object.assign(user, updateData);
  await user.save({ validateBeforeSave: true });

  const updatedUser = await User.findById(id).select("-password -refreshToken -passwordHistory");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const deleteUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const deletionErrors = [];
  if (user.profilePic) {
    try {
      const publicId = user.profilePic.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`User Profiles/${publicId}`);
    } catch (error) {
      if (!error.message.includes("not found")) {
        deletionErrors.push(`Failed to delete profile picture: ${error.message}`);
      }
    }
  }

  if (deletionErrors.length > 0) {
    throw new ApiError(
      500,
      `Some files could not be deleted: ${deletionErrors.join("; ")}`
    );
  }

  await User.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

const getLogsController = async (req, res) => {
  const { startDate, endDate, username } = req.query;

  const query = {};
  if (startDate && endDate) {
    query.timestamp = {
      $gte: startDate,
      $lte: endDate,
    };
  }
  if (username && username !== 'all') {
    query.username = username;
  }

  const logs = await Log.find(query).sort({ timestamp: -1 }).limit(100).lean();

  return res.status(200).json(new ApiResponse(200, logs, 'Logs retrieved successfully'));
};


module.exports = {
  registerUserController,
  generateAccessTokenAndRefreshToken,
  sendOTPVerificationLogin,
  verifyUserOTPLogin,
  logoutUserController,
  getCurrentUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  refreshAccessToken,
  updatePasswordController,
  getLogsController,
};