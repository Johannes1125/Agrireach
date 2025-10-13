import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User } from "@/server/models/User"

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]) ; if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)

  await connectToDatabase()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const role = searchParams.get("role")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
  const skip = (page - 1) * limit

  // Return all users by default; optionally filter by role/status/search
  const filter: any = {}
  if (status && status !== "all") filter.status = status
  if (role && role !== "all") filter.role = role.toLowerCase()
  if (search) {
    filter.$or = [
      { full_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("full_name email role status verified trust_score last_login created_at avatar_url")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ])

  return jsonOk({ users, total, page, pages: Math.ceil(total / limit) })
}
