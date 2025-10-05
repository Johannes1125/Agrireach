import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Upload } from "@/server/models/Upload";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return jsonError("No files provided", 400);
    }

    // Validate max 5 images
    if (files.length > 5) {
      return jsonError("Maximum 5 images allowed", 400);
    }

    const uploadedImages = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return jsonError(`File ${file.name} must be an image`, 400);
      }

      // Validate file size (max 10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        return jsonError(`File ${file.name} size must be less than 10MB`, 400);
      }

      // Upload to Cloudinary
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadToCloudinary(buffer, {
        folder: 'products',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      await connectToDatabase();

      // Save upload record
      await Upload.create({
        user_id: decoded.sub,
        filename: uploadResult.public_id,
        original_name: file.name,
        mime_type: file.type,
        size: file.size,
        url: uploadResult.secure_url,
        type: 'product_image'
      });

      uploadedImages.push({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        original_name: file.name
      });
    }

    return jsonOk({ 
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Product images upload error:', error);
    return jsonError("Upload failed", 500);
  }
}
