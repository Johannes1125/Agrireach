import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User } from "@/server/models/User"
import { Opportunity } from "@/server/models/Job"
import { Product } from "@/server/models/Product"
import { Report } from "@/server/models/Report"
import { Review } from "@/server/models/Review"
import { ForumThread } from "@/server/models/Thread"

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)
  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }
  if (decoded.role !== "admin") return jsonError("Forbidden", 403)

  await connectToDatabase()

  const url = new URL(req.url)
  const timeframe = url.searchParams.get("timeframe") || "30d" // 7d, 30d, 90d, 1y

  // Calculate date range
  const now = new Date()
  let startDate: Date
  switch (timeframe) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case "1y":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  // Generate date buckets for the timeframe
  const days = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
  const dateBuckets: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dateBuckets.push(date.toISOString().split("T")[0])
  }

  // User registrations over time
  const userRegistrations = await User.aggregate([
    {
      $match: {
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 }
      }
    }
  ])

  // Active users over time (users who logged in)
  const activeUsers = await User.aggregate([
    {
      $match: {
        last_login: { $gte: startDate, $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$last_login" } },
        count: { $sum: 1 }
      }
    }
  ])

  // Job postings over time
  const jobPostings = await Opportunity.aggregate([
    {
      $match: {
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 }
      }
    }
  ])

  // Product listings over time
  const productListings = await Product.aggregate([
    {
      $match: {
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 }
      }
    }
  ])

  // Reports over time
  const reports = await Report.aggregate([
    {
      $match: {
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 }
      }
    }
  ])

  // Helper function to fill in missing dates
  const fillTimeSeries = (data: any[], dateBuckets: string[]) => {
    const dataMap = new Map(data.map(item => [item._id, item.count]))
    return dateBuckets.map(date => ({
      date,
      value: dataMap.get(date) || 0
    }))
  }

  // User role distribution - handle both roles array and single role field
  const userRoleDistribution = await User.aggregate([
    {
      $match: { status: "active" }
    },
    {
      $project: {
        rolesArray: {
          $cond: {
            if: { $isArray: "$roles" },
            then: "$roles",
            else: { $cond: { if: "$roles", then: ["$roles"], else: ["$role"] } }
          }
        }
      }
    },
    {
      $unwind: {
        path: "$rolesArray",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: { $ifNull: ["$rolesArray", "unknown"] },
        count: { $sum: 1 }
      }
    },
    {
      $match: { _id: { $ne: null } }
    },
    {
      $sort: { count: -1 }
    }
  ])

  // Report status distribution
  const reportStatusDistribution = await Report.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ])

  // Product category distribution
  const productCategoryDistribution = await Product.aggregate([
    {
      $match: { status: "active" }
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ])

  // Job category distribution
  const jobCategoryDistribution = await Opportunity.aggregate([
    {
      $match: { status: "active" }
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ])

  // Reviews over time
  const reviews = await Review.aggregate([
    {
      $match: {
        created_at: { $gte: startDate },
        status: "active"
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ])

  return jsonOk({
    timeframe,
    timeSeries: {
      userRegistrations: fillTimeSeries(userRegistrations, dateBuckets),
      activeUsers: fillTimeSeries(activeUsers, dateBuckets),
      jobPostings: fillTimeSeries(jobPostings, dateBuckets),
      productListings: fillTimeSeries(productListings, dateBuckets),
      reports: fillTimeSeries(reports, dateBuckets),
      reviews: fillTimeSeries(reviews, dateBuckets)
    },
    distributions: {
      userRoles: userRoleDistribution.map(item => ({
        name: item._id || "Unknown",
        value: item.count
      })),
      reportStatus: reportStatusDistribution.map(item => ({
        name: item._id || "Unknown",
        value: item.count
      })),
      productCategories: productCategoryDistribution.map(item => ({
        name: item._id || "Uncategorized",
        value: item.count
      })),
      jobCategories: jobCategoryDistribution.map(item => ({
        name: item._id || "Uncategorized",
        value: item.count
      }))
    }
  })
}

