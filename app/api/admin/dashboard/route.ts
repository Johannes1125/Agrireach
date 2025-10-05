import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { Opportunity } from "@/server/models/Job";
import { Product, Order } from "@/server/models/Product";
import { ForumThread, ForumPost } from "@/server/models/Thread";
import { Review } from "@/server/models/Review";
import { Report } from "@/server/models/Report";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  // Check if user is admin (you might want to add admin role to User model)
  const user = await User.findById(decoded.sub);
  if (!user || user.role !== "admin") {
    return jsonError("Forbidden - Admin access required", 403);
  }

  // Get current date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get overall stats
  const [
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    totalOpportunities,
    activeOpportunities,
    totalProducts,
    activeProducts,
    totalOrders,
    ordersThisMonth,
    totalThreads,
    totalPosts,
    totalReviews,
    pendingReports
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ created_at: { $gte: startOfMonth } }),
    Opportunity.countDocuments(),
    Opportunity.countDocuments({ status: "active" }),
    Product.countDocuments(),
    Product.countDocuments({ status: "active" }),
    Order.countDocuments(),
    Order.countDocuments({ created_at: { $gte: startOfMonth } }),
    ForumThread.countDocuments({ status: "active" }),
    ForumPost.countDocuments({ status: "active" }),
    Review.countDocuments({ status: "active" }),
    Report.countDocuments({ status: "pending" })
  ]);

  // Get user role distribution
  const userRoleStats = await User.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  // Get recent activity (last 7 days)
  const recentActivity = {
    newUsers: await User.countDocuments({ 
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    newOpportunities: await Opportunity.countDocuments({ 
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    newProducts: await Product.countDocuments({ 
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    newOrders: await Order.countDocuments({ 
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  };

  // Get monthly revenue (from orders)
  const monthlyRevenue = await Order.aggregate([
    { 
      $match: { 
        payment_status: "paid",
        created_at: { $gte: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: "$total_price" } } }
  ]);

  // Get top categories
  const topProductCategories = await Product.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const topJobCategories = await Opportunity.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const stats = {
    overview: {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalOpportunities,
      activeOpportunities,
      totalProducts,
      activeProducts,
      totalOrders,
      ordersThisMonth,
      totalThreads,
      totalPosts,
      totalReviews,
      pendingReports
    },
    userRoles: userRoleStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentActivity,
    revenue: {
      thisMonth: monthlyRevenue[0]?.total || 0
    },
    topCategories: {
      products: topProductCategories,
      jobs: topJobCategories
    }
  };

  return jsonOk({ stats });
}
