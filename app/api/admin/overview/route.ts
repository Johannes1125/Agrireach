import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User } from "@/server/models/User"
import { Opportunity } from "@/server/models/Job"
import { Product } from "@/server/models/Product"

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any; try { decoded = verifyToken<any>(token, "access") } catch { return jsonError("Unauthorized", 401) }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)

  await connectToDatabase()

  const [totalUsers, activeUsers, newUsersToday, totalJobs, totalProducts, reportedContent] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ created_at: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Opportunity.countDocuments({}),
    Product.countDocuments({}),
    Promise.resolve(0),
  ])

  const totalListings = totalJobs + totalProducts
  const pendingReviews = 0
  const platformHealth = Math.max(0, Math.min(100, Math.round((activeUsers / Math.max(1, totalUsers)) * 100)))

  return jsonOk({
    totalUsers,
    activeUsers,
    newUsersToday,
    totalListings,
    pendingReviews,
    reportedContent,
    platformHealth,
  })
}


