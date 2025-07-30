const asyncHandler = require("../utils/asyncHandler");
const Event = require("../model/eventModel");
const { validateUploadedFiles } = require("../utils/valiadateUploadedFiles");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadFileWithFolderLogic, deleteFileFromCloudinary } = require("../helper/cloudinaryHepler");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

// Create event (Admin only)
const createEventController = asyncHandler(async (req, res) => {
  // Validation rules
  await Promise.all([
    body("title")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be at least 3 characters")
      .run(req),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters")
      .run(req),
    body("date")
      .isISO8601()
      .withMessage("Date must be a valid ISO8601 date (e.g., YYYY-MM-DD)")
      .run(req),
    body("time")
      .trim()
      .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .withMessage("Time must be in HH:MM format (24-hour)")
      .run(req),
    body("location")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Location must be at least 3 characters")
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map((err) => err.msg).join("; "));
  }

  const { title, description, date, time, location, capacity } = req.body;

  // Check for existing event by title
  const existingEvent = await Event.findOne({ title: title.toLowerCase() });
  if (existingEvent) {
    throw new ApiError(400, "An event with this title already exists");
  }

  // Validate file uploads (if any)
  let files = [];
  if (req.files && req.files.length > 0) {
    validateUploadedFiles(req.files);

    // Upload files to Cloudinary
    for (const file of req.files) {
      try {
        const result = await uploadFileWithFolderLogic(file.path, file.mimetype, "Event Files");
        console.log(`Cloudinary upload result for ${file.path}:`, result);
        if (result && result.secure_url) {
          files.push({
            url: result.secure_url,
            type: file.mimetype,
          });
        } else {
          throw new ApiError(500, `Failed to upload file ${file.path}`);
        }
      } catch (error) {
        console.error(`Failed to upload file ${file.path}:`, error.message);
        throw new ApiError(500, `File upload failed: ${error.message}`);
      }
    }
  }

  // Create event
  const event = await Event.create({
    title: title.toLowerCase(),
    description: description.toLowerCase(),
    date,
    time,
    location,
    files,
  });

  return res
    .status(201)
    .json(new ApiResponse(201,event,"Event created successfully"));
});

// Update event (Admin only)
const updateEventController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validation rules for optional fields
  await Promise.all([
    body("title")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be at least 3 characters")
      .run(req),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters")
      .run(req),
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be a valid ISO8601 date (e.g., YYYY-MM-DD)")
      .run(req),
    body("time")
      .optional()
      .trim()
      .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .withMessage("Time must be in HH:MM format (24-hour)")
      .run(req),
    body("location")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Location must be at least 3 characters")
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array().map((err) => err.msg).join("; "));
  }

  const { title, description, date, time, location, capacity } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid event ID");
  }

  // Check if at least one field is provided
  if (!title && !description && !date && !time && !location && (!req.files || req.files.length === 0)) {
    throw new ApiError(400, "At least one field must be provided for update");
  }

  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Update fields if provided
  if (title) {
    const existingEvent = await Event.findOne({ title: title.toLowerCase(), _id: { $ne: id } });
    if (existingEvent) {
      throw new ApiError(400, "An event with this title already exists");
    }
    event.title = title.toLowerCase();
  }
  if (description) event.description = description.toLowerCase();
  if (date) event.date = date;
  if (time) event.time = time;
  if (location) event.location = location;

  // Validate and upload new files if provided
  if (req.files && req.files.length > 0) {
    validateUploadedFiles(req.files);
    const newFiles = [];
    for (const file of req.files) {
      try {
        const result = await uploadFileWithFolderLogic(file.path, file.mimetype, "Event Files");
        console.log(`Cloudinary upload result for ${file.path}:`, result);
        if (result && result.secure_url) {
          newFiles.push({
            url: result.secure_url,
            type: file.mimetype,
          });
        } else {
          throw new ApiError(500, `Failed to upload file ${file.path}`);
        }
      } catch (error) {
        console.error(`Failed to upload file ${file.path}:`, error.message);
        throw new ApiError(500, `File upload failed: ${error.message}`);
      }
    }

    if (event.files.length + newFiles.length > 10) {
      throw new ApiError(400, "Total number of files cannot exceed 10");
    }
    event.files = [...event.files, ...newFiles];
  }

  console.log(`Event ${id} updated by admin ${req.user._id}`);
  await event.save();

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event updated successfully"));
});

// Get all events (Admin view with pagination and filtering)
const getAllEventController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, startDate, endDate, query } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const events = await Event.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalEvents = await Event.countDocuments(filter);

  if (!events.length) {
    throw new ApiError(404, "No events found");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      events,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalEvents / limitNum),
        totalEvents,
        limit: limitNum,
      },
    }, "Events fetched successfully")
  );
});

// Get single event by ID (Admin view)
const getEventController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const event = await Event.findById(id);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event fetched successfully"));
});

// Delete event (Admin only)
const deleteEventController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const deletionErrors = [];
  for (const file of event.files) {
    try {
      await deleteFileFromCloudinary(file.url, file.type);
      console.log(`Deleted file ${file.url} from Cloudinary`);
    } catch (error) {
      console.error(`Failed to delete file ${file.url} from Cloudinary:`, error.message);
      if (!error.message.includes("not found")) {
        deletionErrors.push(`Failed to delete ${file.url}: ${error.message}`);
      }
    }
  }

  if (deletionErrors.length > 0) {
    throw new ApiError(500, `Some files could not be deleted from Cloudinary: ${deletionErrors.join("; ")}`);
  }

  console.log(`Event ${id} deleted by admin ${req.user._id}`);
  await Event.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Event deleted successfully"));
});

// Delete specific file from event (Admin only)
const deleteEventFileController = asyncHandler(async (req, res) => {
  const { id, fileUrl } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid event ID");
  }

  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const fileIndex = event.files.findIndex((file) => file.url === fileUrl);
  if (fileIndex === -1) {
    throw new ApiError(404, "File not found in event");
  }

  const file = event.files[fileIndex];

  try {
    await deleteFileFromCloudinary(file.url, file.type);
    console.log(`Deleted file ${file.url} from Cloudinary by admin ${req.user._id}`);
  } catch (error) {
    console.error(`Failed to delete file ${file.url} from Cloudinary:`, error.message);
    if (!error.message.includes("not found")) {
      throw new ApiError(500, `Failed to delete file ${file.url}: ${error.message}`);
    }
  }

  event.files.splice(fileIndex, 1);
  await event.save();

  

  return res
    .status(200)
    .json(new ApiResponse(200, event, "File deleted successfully"));
});

module.exports = {
  createEventController,
  getAllEventController,
  getEventController,
  updateEventController,
  deleteEventController,
  deleteEventFileController,
};