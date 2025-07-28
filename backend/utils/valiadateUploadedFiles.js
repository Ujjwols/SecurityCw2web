// utils/fileValidation.js
const ApiError = require("./ApiError");

// Validation for event files (expects an array of files from upload.array("files", 10))
function validateUploadedFiles(files) {
  if (!files || files.length === 0) {
    throw new ApiError(400, "At least one file is required");
  }
  if (files.length > 10) {
    throw new ApiError(400, "Maximum 10 files allowed");
  }
  const fileCounts = {
    images: 0,
    videos: 0,
    documents: 0,
  };
  files.forEach((file) => {
    if (file.mimetype.startsWith("image/")) {
      fileCounts.images++;
    } else if (file.mimetype.startsWith("video/")) {
      fileCounts.videos++;
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("msword") ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileCounts.documents++;
    } else {
      throw new ApiError(400, `Unsupported file type: ${file.mimetype}`);
    }
  });
  if (fileCounts.images > 5) {
    throw new ApiError(400, "Maximum 5 images allowed");
  }
  if (fileCounts.videos > 3) {
    throw new ApiError(400, "Maximum 3 videos allowed");
  }
  if (fileCounts.documents > 2) {
    throw new ApiError(400, "Maximum 2 documents allowed");
  }
}

// Validation for user files (expects profilePic and optional additionalFile)
function validateUserFiles(files) {
  if (!files || !files.profilePic || files.profilePic.length !== 1) {
    throw new ApiError(400, "Exactly one profile picture is required");
  }
  if (files.additionalFile && files.additionalFile.length > 1) {
    throw new ApiError(400, "Only one additional file is allowed");
  }
  const profilePic = files.profilePic[0];
  if (!profilePic.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Profile picture must be an image");
  }
  if (files.additionalFile) {
    const additionalFile = files.additionalFile[0];
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(additionalFile.mimetype)) {
      throw new ApiError(400, "Additional file must be an image, PDF, or Word document");
    }
  }
}

module.exports = {
  validateUploadedFiles,
  validateUserFiles,
};