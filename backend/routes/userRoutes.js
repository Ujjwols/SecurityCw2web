const express = require("express");
const {
  registerUserController,
  sendOTPVerificationLogin,
  verifyUserOTPLogin,
  logoutUserController,
  getCurrentUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
} = require("../controller/userController");

const { verifyJWT, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const ApiResponse = require("../utils/ApiResponse");

const router = express.Router();

// -------------------- Public Routes --------------------

// Register user with profile picture
router.post(
  "/register",
  upload.fields([{ name: "profilePic", maxCount: 1 }]),
  registerUserController
);

// OTP login initiation
router.post("/send-otp", sendOTPVerificationLogin);

// OTP login verification
router.post("/verify-otp", verifyUserOTPLogin);

// -------------------- Protected Routes (Logged-in Users) --------------------

// Logout
router.post("/logout", verifyJWT,logoutUserController);

// Get current authenticated user
router.get("/get-current-user", verifyJWT, getCurrentUserController);

// Get specific user by ID (accessible by the user themselves or admin if expanded later)
router.get("/get-user/:id", verifyJWT, getUserByIdController);

// Update user profile (with optional profilePic)
router.patch(
  "/update-user/:id",
  verifyJWT,
  upload.fields([{ name: "profilePic", maxCount: 1 }]),
  updateUserController
);

// -------------------- Admin-Only Routes --------------------

// Get all users
router.get("/get-all-users", verifyJWT, restrictTo("admin"), getAllUsersController);

// Delete user
router.delete("/delete-user/:id", verifyJWT, restrictTo("admin"), deleteUserController);

// -------------------- Auth Check --------------------
router.get("/check-auth", verifyJWT, async (req, res) => {
  console.log("Check-auth user:", req.user || "No user");
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "No authenticated user found",
      statusCode: 401,
    });
  }
  return res.status(200).json(
    new ApiResponse(200, req.user, "User is authenticated")
  );
});

module.exports = router;
