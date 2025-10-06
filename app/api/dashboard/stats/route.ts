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
  console.log("DEBUG - User ID:", decoded.sub);
  console.log("DEBUG - User role:", user.role);
  console.log("DEBUG - User roles array:", userRoles);

  // Role-specific stats - check if user has recruiter role
  if (userRoles.includes("recruiter")) {
    // Get all opportunities posted by this recruiter (any status)
    const allRecruiterJobs = await Opportunity.find({ recruiter_id: decoded.sub }).lean();
    console.log("DEBUG - All recruiter jobs:", allRecruiterJobs.length);
    console.log("DEBUG - Job statuses:", allRecruiterJobs.map(j => ({ id: j._id, status: j.status })));
    
    // Get all job IDs posted by this recruiter
    const recruiterJobIds = allRecruiterJobs.map(j => j._id);
    
    // Count active jobs
    const activeJobs = allRecruiterJobs.filter(j => j.status === "active").length;
    console.log("DEBUG - Active jobs count:", activeJobs);
    
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
    
    console.log("DEBUG - Final recruiter stats:", stats.recruiter);
  } else {
    console.log("DEBUG - User does not have recruiter role, skipping recruiter stats");
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
    const [activeProducts, totalOrders, pendingOrders, totalSpent] = await Promise.all([
      Product.countDocuments({ seller_id: decoded.sub, status: "active" }),
      Order.countDocuments({ buyer_id: decoded.sub }),
      Order.countDocuments({ buyer_id: decoded.sub, status: "pending" }),
      Order.aggregate([
        { $match: { buyer_id: decoded.sub } },
        { $group: { _id: null, total: { $sum: "$total_price" } } }
      ])
    ]);

    stats.buyer = {
      activeProducts,
      totalOrders,
      pendingOrders,
      totalSpent: totalSpent[0]?.total || 0
    };

    // Also get seller stats if they have products
    const [sellerOrders, totalEarnings] = await Promise.all([
      Order.countDocuments({ seller_id: decoded.sub }),
      Order.aggregate([
        { $match: { seller_id: decoded.sub, payment_status: "paid" } },
        { $group: { _id: null, total: { $sum: "$total_price" } } }
      ])
    ]);

    if (sellerOrders > 0) {
      stats.seller = {
        totalOrders: sellerOrders,
        totalEarnings: totalEarnings[0]?.total || 0
      };
    }
  }

  console.log("DEBUG - Returning final stats:", JSON.stringify(stats, null, 2));
  return jsonOk({ stats });
}
