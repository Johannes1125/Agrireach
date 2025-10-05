import { NextRequest } from "next/server"
import { z } from "zod"
import { jsonOk, jsonError, requireAuth } from "@/server/utils/api"
import { 
  uploadToCloudinary, 
  uploadProfileAvatar, 
  uploadProductImage, 
  uploadBusinessLogo,
  uploadCommunityImage 
} from "@/server/utils/cloudinary"

const uploadSchema = z.object({
  type: z.enum(['avatar', 'product', 'business', 'community', 'general']),
  entityId: z.string().optional(), // productId, threadId, etc.
  imageIndex: z.number().optional().default(0)
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const entityId = formData.get('entityId') as string
    const imageIndex = parseInt(formData.get('imageIndex') as string || '0')

    if (!file) {
      return jsonError("No file provided", 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return jsonError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed", 400)
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return jsonError("File too large. Maximum size is 10MB", 400)
    }

    // Validate request data
    const validation = uploadSchema.safeParse({ type, entityId, imageIndex })
    if (!validation.success) {
      return jsonError("Invalid upload parameters", 400)
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let uploadResult

    // Handle different upload types
    switch (type) {
      case 'avatar':
        uploadResult = await uploadProfileAvatar(buffer, user.id)
        break
        
      case 'product':
        if (!entityId) {
          return jsonError("Product ID is required for product images", 400)
        }
        uploadResult = await uploadProductImage(buffer, entityId, imageIndex)
        break
        
      case 'business':
        uploadResult = await uploadBusinessLogo(buffer, user.id)
        break
        
      case 'community':
        if (!entityId) {
          return jsonError("Thread ID is required for community images", 400)
        }
        uploadResult = await uploadCommunityImage(buffer, entityId, imageIndex)
        break
        
      case 'general':
      default:
        uploadResult = await uploadToCloudinary(buffer, {
          folder: 'agrireach/general',
          tags: ['general', user.role]
        })
        break
    }

    return jsonOk({
      message: "File uploaded successfully",
      upload: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    })

  } catch (error: any) {
    console.error("Upload error:", error)
    return jsonError(error.message || "Failed to upload file", 500)
  }
}
