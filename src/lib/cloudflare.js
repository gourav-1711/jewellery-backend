const crypto = require("crypto");
const path = require("path");
const sharp = require("sharp");
const {
  s3Client,
  generateSignedUrl,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("../config/cloudflare.config");
const { configDotenv } = require("dotenv");
configDotenv();

/**
 * Generate a unique filename with folder structure
 */
const generateFileName = (originalName, folder = "") => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalName).toLowerCase();
  const name = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  return `${
    folder ? `${folder}/` : ""
  }${name}-${randomString}-${timestamp}${ext}`;
};

/**
 * Optimize image using Sharp
 */
const optimizeImage = async (buffer, options = {}) => {
  const { quality = 80, width = 1200, height = 1200 } = options;

  return sharp(buffer)
    .resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      alphaQuality: 85,
      lossless: false,
      nearLossless: true,
      smartSubsample: true,
      effort: 6, // Balanced between speed and compression
    })
    .toBuffer();
};

/**
 * Upload file to Cloudflare R2
 */
const uploadToR2 = async (file, folder = "users") => {
  try {
    // Generate unique filename
    const fileName = generateFileName(file.originalname, folder);

    // Optimize image if it's an image
    const isImage = file.mimetype.startsWith("image/");
    const fileBuffer = isImage ? await optimizeImage(file.buffer) : file.buffer;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    });

    

    await s3Client.send(command);

    // Generate public URL (if public access is enabled)
    const fileUrl = `https://${process.env.CLOUDFLARE_BUCKET_NAME}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`;

    return {
      success: true,
      url: fileUrl,
      fileName,
      size: fileBuffer.length,
      mimeType: file.mimetype,
    };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw new Error("Failed to upload file to Cloudflare R2");
  }
};

/**
 * Delete file from Cloudflare R2
 */
const deleteFromR2 = async (fileName) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("R2 Delete Error:", error);
    throw new Error("Failed to delete file from Cloudflare R2");
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleToR2 = async (files, folder = "products") => {
  try {
    const uploadPromises = files.map((file) => uploadToR2(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("R2 Multiple Upload Error:", error);
    throw new Error("Failed to upload files to Cloudflare R2");
  }
};

module.exports = {
  uploadToR2,
  deleteFromR2,
  uploadMultipleToR2,
  optimizeImage,
};
