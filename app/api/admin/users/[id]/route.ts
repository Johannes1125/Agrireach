import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User } from "@/server/models/User"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"])
  if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)

  const { id } = await params
  await connectToDatabase()
  const body = await req.json().catch(() => ({}))
  const { action, role } = body || {}

  const set: any = {}
  switch (action) {
    case "verify":
      set.verified = true;
      set.verification_status = "verified";
      set.verification_reviewed_at = new Date();
      break
    case "unverify":
      set.verified = false;
      set.verification_status = "none";
      set.verification_reviewed_at = new Date();
      break
    case "reject":
      set.verified = false;
      set.verification_status = "rejected";
      set.verification_reviewed_at = new Date();
      break
    case "suspend": set.status = "suspended"; break
    case "unsuspend": set.status = "active"; break
    case "ban": set.status = "banned"; break
    case "role": if (role) set.role = role; break
    default: return jsonError("Invalid action", 400)
  }

  const updated = await User.findByIdAndUpdate(id, { $set: set }, { new: true })
  if (!updated) return jsonError("User not found", 404)
  return jsonOk({
    user: {
      _id: updated._id,
      role: updated.role,
      status: updated.status,
      verified: updated.verified,
      verification_status: updated.verification_status,
    },
  })
}


