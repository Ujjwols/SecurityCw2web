const cloudinary = require("cloudinary").v2;
const { uploadOnCloudinary } = require("../utils/cloudinary");

const getSubfolderByMimeType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "Images";
  if (mimetype.startsWith("video/")) return "Videos";
  if (
    mimetype === "application/pdf" ||
    mimetype.includes("word")
  ) return "Documents";
  return "Others";
};

// Helper to extract publicId from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    console.log(`Decoded URL: ${decodedUrl}`);
    
    // Remove the base URL parts and file extension
    const cloudinaryUrlParts = decodedUrl.split('/upload/');
    if (cloudinaryUrlParts.length < 2) {
      throw new Error("Invalid Cloudinary URL format");
    }
    
    // Get everything after /upload/
    const pathWithVersion = cloudinaryUrlParts[1];
    
    // Remove version if present (v1234567890/)
    const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, '');
    
    // Remove file extension
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');
    
    console.log(`Extracted publicId: ${publicId}`);
    return publicId;
  } catch (error) {
    console.error(`Failed to extract publicId from ${url}:`, error.message);
    throw new Error(`Failed to extract publicId: ${error.message}`);
  }
};

const uploadFileWithFolderLogic = async (filePath, mimetype, context = "General") => {
  const subfolder = getSubfolderByMimeType(mimetype);
  const folder = `${context}/${subfolder}`; // e.g., Event Files/Images
  return await uploadOnCloudinary(filePath, folder);
};

// Delete file from Cloudinary
const deleteFileFromCloudinary = async (url, mimetype) => {
  if (!url || !mimetype) {
    console.warn(`Missing URL or mimetype for deletion: ${url}, ${mimetype}`);
    return;
  }
  try {
    if (!cloudinary || !cloudinary.uploader) {
      throw new Error("Cloudinary module is not initialized");
    }
    
    const publicId = getPublicIdFromUrl(url);
    const resourceType = mimetype.startsWith('video/') ? 'video' : 
                        mimetype === 'application/pdf' || 
                        mimetype.includes('word') || 
                        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'raw' : 'image';
    
    console.log(`Deleting from Cloudinary: publicId=${publicId}, resourceType=${resourceType}`);
    
    // Add folder prefix if not already present in publicId
    const options = { 
      resource_type: resourceType,
      invalidate: true // Optional: purge from CDN cache
    };
    
    const result = await cloudinary.uploader.destroy(publicId, options);
    
    if (result.result !== 'ok') {
      console.warn(`Cloudinary deletion result: ${JSON.stringify(result)}`);
      // Don't throw error for "not found" - resource might already be deleted
      if (result.result !== 'not found') {
        throw new Error(`Cloudinary deletion failed: ${JSON.stringify(result)}`);
      }
      return result; // Return even for not found cases
    }
    
    console.log(`Successfully deleted ${publicId} from Cloudinary: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error(`Cloudinary delete failed for ${url}:`, error.message);
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  uploadFileWithFolderLogic,
  getPublicIdFromUrl,
  deleteFileFromCloudinary
};
