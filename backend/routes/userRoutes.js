const express = require("express");
const csrfProtection = require("../middleware/csrfProtection");
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
  updatePasswordController,
  refreshAccessToken,
} = require("../controller/userController");

const { verifyJWT, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const ApiResponse = require("../utils/ApiResponse");

const router = express.Router();

// -------------------- Public Routes --------------------
router.post(
  "/register",
  csrfProtection,
  upload.fields([{ name: "profilePic", maxCount: 1 }]),
  registerUserController
);

router.post("/refresh-token", csrfProtection, refreshAccessToken);

router.post("/send-otp", csrfProtection, sendOTPVerificationLogin);
router.post("/verify-otp", csrfProtection, verifyUserOTPLogin);

// -------------------- Protected Routes (Logged-in Users) --------------------
router.post("/logout", verifyJWT, csrfProtection, logoutUserController);
router.get("/get-current-user", verifyJWT, getCurrentUserController);
router.get("/get-user/:id", verifyJWT, getUserByIdController);
router.patch(
  "/update-user/:id",
  verifyJWT,
  csrfProtection,
  upload.fields([{ name: "profilePic", maxCount: 1 }]),
  updateUserController
);
router.post(
  "/update-password",
  verifyJWT,
  csrfProtection,
  updatePasswordController
);

// -------------------- Admin-Only Routes --------------------
router.get("/get-all-users", verifyJWT, restrictTo("admin"), getAllUsersController);
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