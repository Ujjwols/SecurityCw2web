const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// 🔴 Replace these with your actual Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folderName = "uploads") => {
  try {
    if (!localFilePath) throw new Error("File path is missing");

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folderName,
    });

    fs.unlinkSync(localFilePath); // Cleanup local file
    return uploadResult;
  } catch (error) {
    try {
      fs.unlinkSync(localFilePath); // Attempt cleanup
    } catch (_) {}
    throw new Error("Cloudinary upload failed: " + error.message);
  }
};

module.exports = {
  uploadOnCloudinary,

};
