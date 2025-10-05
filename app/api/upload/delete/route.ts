import { NextRequest } from "next/server"
import { z } from "zod"
import { jsonOk, jsonError, requireAuth } from "@/server/utils/api"
import { deleteFromCloudinary } from "@/server/utils/cloudinary"

const deleteSchema = z.object({
  publicId: z.string().min(1, "Public ID is required")
})

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req)
    
    const body = await req.json()
    const validation = deleteSchema.safeParse(body)
    
    if (!validation.success) {
      return jsonError("Invalid request data", 400)
    }

    const { publicId } = validation.data

    await deleteFromCloudinary(publicId)

    return jsonOk({
      message: "Image deleted successfully"
    })

  } catch (error: any) {
    console.error("Delete error:", error)
    return jsonError(error.message || "Failed to delete image", 500)
  }
}
