const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/authMiddleware");
const csrfProtection = require("../middleware/csrfProtection");
const {
  initializePaymentController,
  verifyPaymentController,
  getPaymentStatusController,
  getUserRegistrationsController,
  cancelRegistrationController,
  khaltiWebhookController,
  getPaymentByOrderIdController,
  checkPaymentStatusController,
  triggerWebhookController,
  testKhaltiConnectionController,
} = require("../controller/paymentController");

// Public webhook endpoint (no authentication required)
router.post("/khalti-webhook", khaltiWebhookController);

// Protected payment routes (require authentication)
router.post("/initiate", verifyJWT, csrfProtection, initializePaymentController);
router.post("/verify", verifyJWT, csrfProtection, verifyPaymentController);
router.post("/check-status", verifyJWT, csrfProtection, checkPaymentStatusController);
router.get("/status/:transactionId", verifyJWT, getPaymentStatusController);
router.get("/order/:orderId", verifyJWT, getPaymentByOrderIdController);
router.get("/registrations", verifyJWT, getUserRegistrationsController);
router.post("/cancel-registration/:registrationId", verifyJWT, csrfProtection, cancelRegistrationController);
router.post("/trigger-webhook", verifyJWT, csrfProtection, triggerWebhookController);

module.exports = router; 