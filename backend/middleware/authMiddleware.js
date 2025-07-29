const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../model/userModel");
const { redisClient } = require("../utils/redisClient");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      console.log('Using accessToken from cookie');
    } else {
      const authHeader = req.header("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
        console.log('Using token from Authorization header');
      }
    }

    if (!token) {
      throw new ApiError(401, "Unauthorized access: No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });

    if (!decodedToken?._id) {
      throw new ApiError(401, "Invalid token: Missing user ID");
    }

    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new ApiError(401, "Token has been revoked");
    }

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid token: User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid token: " + error.message);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Authentication failed: " + error.message);
  }
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
};

module.exports = { verifyJWT, restrictTo };