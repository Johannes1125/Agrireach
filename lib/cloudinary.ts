import { v2 as cloudinary } from "cloudinary";

// Support either explicit credentials or CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL } as any);
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Re-export functions from server/utils/cloudinary for convenience
export {
  uploadToCloudinary,
  uploadProfileAvatar,
  uploadProductImage,
  uploadBusinessLogo,
  uploadCommunityImage,
  deleteFromCloudinary,
  generateImageUrl,
  getImageInfo,
  type CloudinaryUploadResult,
  type UploadOptions,
} from "@/server/utils/cloudinary";

export default cloudinary;