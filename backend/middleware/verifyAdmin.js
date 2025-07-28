const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(400, "Admins only");
  }
});

module.exports = verifyAdmin;
