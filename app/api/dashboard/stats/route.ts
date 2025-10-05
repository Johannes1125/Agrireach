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

  // Role-specific stats
  if (user.role === "recruiter") {
    const [activeJobs, totalApplications, pendingApplications] = await Promise.all([
      Opportunity.countDocuments({ recruiter_id: decoded.sub, status: "active" }),
      JobApplication.countDocuments({ 
        opportunity_id: { $in: await Opportunity.find({ recruiter_id: decoded.sub }).distinct('_id') }
      }),
      JobApplication.countDocuments({ 
        opportunity_id: { $in: await Opportunity.find({ recruiter_id: decoded.sub }).distinct('_id') },
        status: "pending"
      })
    ]);

    stats.recruiter = {
      activeJobs,
      totalApplications,
      pendingApplications
    };
  }

  if (user.role === "worker") {
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

  if (user.role === "buyer") {
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

  return jsonOk({ stats });
}
