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
    const files = formData.getAll('documents') as File[];
    
    if (!files || files.length === 0) {
      return jsonError("No files provided", 400);
    }

    // Validate max 10 documents
    if (files.length > 10) {
      return jsonError("Maximum 10 documents allowed", 400);
    }

    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    const uploadedDocuments = [];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return jsonError(`File ${file.name} type not allowed`, 400);
      }

      // Validate file size (max 10MB per document)
      if (file.size > 10 * 1024 * 1024) {
        return jsonError(`File ${file.name} size must be less than 10MB`, 400);
      }

      // Upload to Cloudinary
      const buffer = Buffer.from(await file.arrayBuffer());
      const isImage = file.type.startsWith('image/');
      
      const uploadResult = await uploadToCloudinary(buffer, {
        folder: 'documents',
        resource_type: isImage ? 'image' : 'raw',
        ...(isImage && {
          transformation: [
            { width: 1200, height: 1600, crop: 'limit' },
            { quality: 'auto' }
          ]
        })
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
        type: 'document'
      });

      uploadedDocuments.push({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        original_name: file.name,
        type: file.type
      });
    }

    return jsonOk({ 
      documents: uploadedDocuments,
      message: `${uploadedDocuments.length} document(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Documents upload error:', error);
    return jsonError("Upload failed", 500);
  }
}
