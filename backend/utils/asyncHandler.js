const asyncHandler = (fn) => async (req, res, next) => {
  try {
    // Execute the passed function and return its result
    const result = await fn(req, res, next);
    return result;
  } catch (error) {
    // Pass error to Express error handler
    console.error("AsyncHandler caught error:", error);
    next(error);
  }
};

module.exports = asyncHandler;