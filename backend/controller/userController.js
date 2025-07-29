const asyncHandler = require("../utils/asyncHandler");
const User = require("../model/userModel");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { sendOTPController, verifyOTPController } = require("../controller/otpController");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const cloudinary = require("cloudinary").v2;
const { redisClient } = require("../utils/redisClient");
const { body, validationResult } = require("express-validator");

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    if (user.refreshToken) {
      await redisClient.set(`blacklist:${user.refreshToken}`, 'true', 'EX', 7 * 24 * 60 * 60);
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
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters').run(req),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format').run(req),
    body('password').matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/)
      .withMessage('Password must be at least 6 characters with one capital letter, one number, and one special character').run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map(err => err.msg).join('; '));
  }

  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });

  if (existingUser) {
    throw new ApiError(400, "User already exists with this username or email");
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
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const sendOTPVerificationLogin = asyncHandler(async (req, res) => {
  await Promise.all([
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format').run(req),
    body('password').notEmpty().withMessage('Password is required').run(req),
    body('deliveryMethod').notEmpty().withMessage('Delivery method is required').run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map(err => err.msg).join('; '));
  }

  const { email, password, deliveryMethod } = req.body;

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

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000,
    };

    const refreshOptions = {
      ...options,
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
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

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000,
    };

    const refreshOptions = {
      ...options,
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
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
    await redisClient.set(`blacklist:${refreshToken}`, 'true', 'EX', 7 * 24 * 60 * 60);
    await redisClient.set(`blacklist:${req.cookies.accessToken}`, 'true', 'EX', parseInt(process.env.ACCESS_TOKEN_EXPIRY));
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUserController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
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
  const users = await User.find(query).select("-password -refreshToken");

  if (!users || users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully"));
});

const getUserByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password -refreshToken");
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

  const updatedUser = await User.findById(id).select("-password -refreshToken");

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
};