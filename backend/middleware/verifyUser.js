const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const verifyUser = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "user") {
    throw new ApiError(400, "User");
  }
});

module.exports = verifyUser;
