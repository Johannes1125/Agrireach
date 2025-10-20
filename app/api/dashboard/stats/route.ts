import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { Opportunity, JobApplication } from "@/server/models/Job";
import { Product, Order } from "@/server/models/Product";
import { Review } from "@/server/models/Review";
import { Notification } from "@/server/models/Notification";

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
  
  const user = await User.findById(decoded.sub);
  if (!user) return jsonError("User not found", 404);

  const stats: any = {
    user: {
      id: user._id,
      full_name: user.full_name,
      role: user.role,
      trust_score: user.trust_score,
      verified: user.verified
    }
  };

  // Common stats for all users
  const [unreadNotifications, reviewsReceived] = await Promise.all([
    Notification.countDocuments({ user_id: decoded.sub, read: false }),
    Review.countDocuments({ reviewee_id: decoded.sub, status: "active" })
  ]);

  stats.unreadNotifications = unreadNotifications;
  stats.reviewsReceived = reviewsReceived;

  // Get user roles (support both single role and multiple roles)
  const userRoles = (user as any).roles || [user.role];

  // Role-specific stats - check if user has recruiter role
  if (userRoles.includes("recruiter")) {
    // Get all opportunities posted by this recruiter (any status)
    const allRecruiterJobs = await Opportunity.find({ recruiter_id: decoded.sub }).lean();
    
    // Get all job IDs posted by this recruiter
    const recruiterJobIds = allRecruiterJobs.map(j => j._id);
    
    // Count active jobs
    const activeJobs = allRecruiterJobs.filter(j => j.status === "active").length;
    
    const [totalApplications, pendingApplications, acceptedApplications] = await Promise.all([
      JobApplication.countDocuments({ 
        opportunity_id: { $in: recruiterJobIds }
      }),
      JobApplication.countDocuments({ 
        opportunity_id: { $in: recruiterJobIds },
        status: "pending"
      }),
      JobApplication.countDocuments({ 
        opportunity_id: { $in: recruiterJobIds },
        status: "accepted"
      })
    ]);

    stats.recruiter = {
      activeJobs,
      totalApplications,
      pendingApplications,
      hiredWorkers: acceptedApplications
    };
  }

  // Check if user has worker role
  if (userRoles.includes("worker")) {
    const [activeApplications, acceptedJobs, pendingApplications] = await Promise.all([
      JobApplication.countDocuments({ worker_id: decoded.sub }),
      JobApplication.countDocuments({ worker_id: decoded.sub, status: "accepted" }),
      JobApplication.countDocuments({ worker_id: decoded.sub, status: "pending" })
    ]);

    stats.worker = {
      activeApplications,
      acceptedJobs,
      pendingApplications
    };
  }

  // Check if user has buyer role
  if (userRoles.includes("buyer")) {
    const [totalOrders, pendingOrders, totalSpent] = await Promise.all([
      Order.countDocuments({ buyer_id: decoded.sub }),
      Order.countDocuments({ buyer_id: decoded.sub, status: "pending" }),
      Order.aggregate([
        { $match: { buyer_id: decoded.sub } },
        { $group: { _id: null, total: { $sum: "$total_price" } } }
      ])
    ]);

    stats.buyer = {
      totalOrders,
      pendingOrders,
      totalSpent: totalSpent[0]?.total || 0
    };
  }

  // Check if user has seller role (separate from buyer)
  if (userRoles.includes("seller") || userRoles.includes("buyer")) {
    const [activeProducts, sellerOrders, totalEarnings] = await Promise.all([
      Product.countDocuments({ seller_id: decoded.sub, status: "active" }),
      Order.countDocuments({ seller_id: decoded.sub }),
      Order.aggregate([
        { $match: { seller_id: decoded.sub, payment_status: "paid" } },
        { $group: { _id: null, total: { $sum: "$total_price" } } }
      ])
    ]);

    stats.seller = {
      activeProducts,
      totalOrders: sellerOrders,
      totalEarnings: totalEarnings[0]?.total || 0
    };
  }

  return jsonOk({ stats });
}
