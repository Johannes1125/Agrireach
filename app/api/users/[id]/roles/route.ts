import { NextRequest } from "next/server"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User } from "@/server/models/User"
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { z } from "zod"

const RolesUpdateSchema = z.object({
  roles: z.array(z.enum(["worker", "recruiter", "buyer"])).min(1, "At least one role is required")
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"])
  if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)

  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }

  // Users can only update their own roles (not even admins can change other users' roles this way)
  if (decoded.sub !== params.id) {
    return jsonError("Forbidden - You can only update your own roles", 403)
  }

  try {
    const body = await req.json()
    const result = RolesUpdateSchema.safeParse(body)

    if (!result.success) {
      return jsonError(result.error.errors[0].message, 400)
    }

    await connectToDatabase()

    // Update user roles AND sync the legacy role field for backward compatibility
    const user = await User.findByIdAndUpdate(
      params.id,
      { 
        $set: { 
          roles: result.data.roles,
          role: result.data.roles[0] // Set the first role as the primary/legacy role
        } 
      },
      { new: true }
    )

    if (!user) {
      return jsonError("User not found", 404)
    }

    console.log("Roles updated successfully:", {
      userId: user._id,
      roles: user.roles,
      primaryRole: user.role
    })

    return jsonOk({
      message: "Roles updated successfully",
      roles: user.roles,
      role: user.role
    })
  } catch (error: any) {
    console.error("Error updating user roles:", error)
    return jsonError(error.message || "Failed to update roles", 500)
  }
}

