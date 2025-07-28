const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../model/userModel");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Retrieve token from cookies or Authorization header
    let token;
    // Check cookies first
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      console.log('Using accessToken from cookie');
    } 
    // Then check Authorization header
    else {
      const authHeader = req.header("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(401, "No authorization token provided");
      }
      token = authHeader.split(" ")[1];
      console.log('Using token from Authorization header');
    }

    if (!token) {
      throw new ApiError(401, "Unauthorized access: No token provided");
    }

    // 2. Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    if (!decodedToken?._id) {
      throw new ApiError(401, "Invalid token: Missing user ID");
    }

    // 3. Fetch user
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid token: User not found");
    }

    // 4. Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    // More specific error handling
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid token: " + error.message);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token expired");
    }
    // Re-throw if it's already an ApiError
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Authentication failed: " + error.message);
  }
});

module.exports = verifyJWT;