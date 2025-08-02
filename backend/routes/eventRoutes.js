const express = require("express");
const router = express.Router();
const { verifyJWT, restrictTo } = require("../middleware/authMiddleware");
const  csrfProtection  = require("../middleware/csrfProtection");
const upload = require("../middleware/multer");
const {
  createEventController,
  getAllEventController,
  getEventController,
  updateEventController,
  deleteEventController,
  deleteEventFileController,
} = require("../controller/eventController");

// Public routes
router.get("/get-all-event", getAllEventController);
router.get("/get-event/:id", getEventController);



// Admin-only routes
router.post(
  "/create-event",
  verifyJWT,
  restrictTo("admin"),
  csrfProtection,
  upload.array("files", 10),
  createEventController
);
router.put(
  "/update-event/:id",
  verifyJWT,
  restrictTo("admin"),
  csrfProtection,
  upload.array("files", 10),
  updateEventController
);
router.delete("/delete-event/:id", verifyJWT, restrictTo("admin"), csrfProtection, deleteEventController);
router.delete("/delete-event-file/:id/:fileUrl", verifyJWT, restrictTo("admin"), csrfProtection, deleteEventFileController);

module.exports = router;