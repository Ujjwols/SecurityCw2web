const asyncHandler = require("../utils/asyncHandler");
const User = require("../model/userModel");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { sendOTPController, verifyOTPController } = require("./otpController");
const { v4: uuidv4 } = require("uuid");
const validateUserFiles = require("../utils/valiadateUploadedFiles");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const cloudinary = require("cloudinary").v2;

// Generate refresh and access tokens
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating access token and refresh token"
    );
  }
};

// Register a new user
const registerUserController = asyncHandler(async (req, res) => {
  const {
    username,
    mobileNumber,
    email,
    password,
  } = req.body;

  const requiredFields = {
    username,
    email,
    password,
    mobileNumber,
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value && key !== "username" && key !== "email") {
      throw new ApiError(400, `Field '${key}' is required`);
    }
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }, { mobileNumber }],
  });

  if (existingUser) {
    throw new ApiError(
      400,
      "User already exists with this employee ID, email, or phone number"
    );
  }

  // Validate file uploads
  validateUserFiles(req.files);

  // Upload profile picture to Cloudinary
  let profilePicUrl = "";
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

  // Upload additional file to Cloudinary (if provided)
  let files = [];
  if (req.files.additionalFile) {
    try {
      const fileResult = await uploadOnCloudinary(
        req.files.additionalFile[0].path,
        "User Files"
      );
      if (fileResult && fileResult.secure_url) {
        files.push({
          url: fileResult.secure_url,
          type: req.files.additionalFile[0].mimetype,
        });
      } else {
        throw new ApiError(500, "Failed to upload additional file");
      }
    } catch (error) {
      throw new ApiError(500, `Additional file upload failed: ${error.message}`);
    }
  }

  // Create user
  const user = await User.create({
    ...requiredFields,
    profilePic: profilePicUrl,
    files,
    membershipStatus: "pending",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(400, "Error while creating user");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

// Send OTP for login
const sendOTPVerificationLogin = asyncHandler(async (req, res) => {
  const { email, password, deliveryMethod } = req.body;

  if (!email || !password || !deliveryMethod) {
    throw new ApiError(400, "Email, password, and delivery method are required");
  }
  if (!["sms", "email"].includes(deliveryMethod)) {
    throw new ApiError(400, "Invalid delivery method. Use 'sms' or 'email'");
  }

  const user = await User.findOne({ email });
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

  const identifier = deliveryMethod === "sms" ? user.mobileNumber : user.email;
  if (!identifier) {
    throw new ApiError(
      400,
      `User does not have a ${deliveryMethod === "sms" ? "mobile number" : "email"} registered`
    );
  }

  try {
    const { token, identifier: returnedIdentifier, deliveryMethod: returnedMethod, message } =
      await sendOTPController({
        identifier,
        deliveryMethod,
      });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { token, identifier: returnedIdentifier, deliveryMethod: returnedMethod },
          message
        )
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to send OTP"
    );
  }
});

// Verify OTP and login
const verifyUserOTPLogin = asyncHandler(async (req, res) => {
  const { token, otp, deliveryMethod } = req.body;

  if (!token || !otp || !deliveryMethod) {
    throw new ApiError(400, "Token, OTP, and delivery method are required");
  }
  if (!["sms", "email"].includes(deliveryMethod)) {
    throw new ApiError(400, "Invalid delivery method. Use 'sms' or 'email'");
  }

  try {
    const { identifier, message } = await verifyOTPController({
      token,
      otp,
      deliveryMethod,
    });

    const user = await User.findOne(
      deliveryMethod === "sms" ? { mobileNumber: identifier } : { email: identifier }
    );
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
      sameSite: "Lax",
    };

    console.log("Setting cookies:", { accessToken, refreshToken });

    return res
      .status(200)
      .cookie("accessToken", accessToken,
      options)
      .cookie("refreshToken",
      refreshToken,
      options)
      .json(
        new ApiResponse(
          200,
          { loggedInUser,
          accessToken,
          refreshToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.error("Error in verifyUserOTPLogin:", error);
    throw error;
  }
});

// Logout user
const logoutUserController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "No refresh token found");
  }

  const user = await User.findOne({ refreshToken });
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Get all users
const getAllUsersController = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { membershipStatus: status } : {};
  const users = await User.find(query).select("-password -refreshToken");

  if (!users || users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully"));
});

// Get user by ID
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

// Update user by ID
const updateUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  delete updateData.password;
  delete updateData.refreshToken;
  delete updateData.role;
  delete updateData.membershipNumber;
  delete updateData.registrationNumber;
  delete updateData.membershipStatus;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Validate file uploads if provided
  if (req.files && (req.files.profilePic || req.files.additionalFile)) {
    validateUserFiles(req.files);

    // Update profile picture if provided
    if (req.files.profilePic) {
      try {
        // Delete old profile picture from Cloudinary if exists
        if (user.profilePic) {
          const publicId = user.profilePic.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`User Profiles/${publicId}`);
        }
        // Upload new profile picture
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

    // Update additional file if provided
    if (req.files.additionalFile) {
      try {
        // Delete old file from Cloudinary if exists
        if (user.files.length > 0) {
          const publicId = user.files[0].url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`User Files/${publicId}`);
        }
        // Upload new file
        const fileResult = await uploadOnCloudinary(
          req.files.additionalFile[0].path,
          "User Files"
        );
        if (fileResult && fileResult.secure_url) {
          user.files = [
            {
              url: fileResult.secure_url,
              type: req.files.additionalFile[0].mimetype,
            },
          ];
        } else {
          throw new ApiError(500, "Failed to upload additional file");
        }
      } catch (error) {
        throw new ApiError(500, `Additional file upload failed: ${error.message}`);
      }
    }
  }

  // Update other fields
  Object.assign(user, updateData);
  await user.save({ validateBeforeSave: true });

  const updatedUser = await User.findById(id).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

// Delete user by ID
const deleteUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete files from Cloudinary
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

  if (user.files.length > 0) {
    try {
      const publicId = user.files[0].url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`User Files/${publicId}`);
    } catch (error) {
      if (!error.message.includes("not found")) {
        deletionErrors.push(`Failed to delete additional file: ${error.message}`);
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
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
};