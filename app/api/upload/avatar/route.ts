import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
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
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return jsonError("No file provided", 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return jsonError("File must be an image", 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return jsonError("File size must be less than 5MB", 400);
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    await connectToDatabase();

    // Update user avatar
    await User.findByIdAndUpdate(decoded.sub, {
      $set: { avatar_url: uploadResult.secure_url }
    });

    // Save upload record
    await Upload.create({
      user_id: decoded.sub,
      filename: uploadResult.public_id,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      url: uploadResult.secure_url,
      type: 'avatar'
    });

    return jsonOk({ 
      url: uploadResult.secure_url,
      message: "Avatar uploaded successfully"
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return jsonError("Upload failed", 500);
  }
}
