import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import mongoose from "mongoose";
import { User } from "@/server/models/User";
import { Opportunity, JobApplication } from "@/server/models/Job";
import { Product, Order } from "@/server/models/Product";
import { Review } from "@/server/models/Review";
import { ForumThread, ForumPost } from "@/server/models/Thread";

// Ensure User model is registered at module load time
if (typeof mongoose !== 'undefined' && !mongoose.models.User) {
  void User;
}

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

  const limit = parseInt(new URL(req.url).searchParams.get("limit") || "10", 10);
  const activities: any[] = [];

  // Determine roles (supports multi-role accounts)
  const userRoles: string[] = (user as any).roles && Array.isArray((user as any).roles)
    ? (user as any).roles
    : [user.role]

  // Get recent activities based on user roles
  if (userRoles.includes("recruiter")) {
    // Recent job postings
    const recentJobs = await Opportunity.find({ recruiter_id: decoded.sub })
      .sort({ created_at: -1 })
      .limit(limit / 2)
      .lean();

    recentJobs.forEach(job => {
      activities.push({
        type: 'job_posted',
        title: 'Job Posted',
        description: `Posted "${job.title}"`,
        timestamp: job.created_at,
        data: { job_id: job._id, job_title: job.title }
      });
    });

    // Recent applications received
    const recentApplications = await JobApplication.find({
      opportunity_id: { $in: await Opportunity.find({ recruiter_id: decoded.sub }).distinct('_id') }
    })
    .populate('opportunity_id', 'title')
    .populate('worker_id', 'full_name')
    .sort({ created_at: -1 })
    .limit(limit / 2)
    .lean();

    recentApplications.forEach((app: any) => {
      const worker = typeof app.worker_id === 'object' ? app.worker_id : null;
      const opportunity = typeof app.opportunity_id === 'object' ? app.opportunity_id : null;
      activities.push({
        type: 'application_received',
        title: 'Application Received',
        description: `${worker?.full_name || 'A worker'} applied to "${opportunity?.title || 'a job'}"`,
        timestamp: app.created_at,
        data: { application_id: app._id, job_title: opportunity?.title }
      });
    });
  }

  if (userRoles.includes("worker")) {
    // Recent applications submitted
    const recentApplications = await JobApplication.find({ worker_id: decoded.sub })
      .populate('opportunity_id', 'title')
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    recentApplications.forEach((app: any) => {
      const opportunity = typeof app.opportunity_id === 'object' ? app.opportunity_id : null;
      activities.push({
        type: app.status === 'accepted' ? 'application_accepted' : app.status === 'rejected' ? 'application_rejected' : 'application_submitted',
        title: app.status === 'accepted' ? 'Application Accepted' : app.status === 'rejected' ? 'Application Rejected' : 'Application Submitted',
        description: `${app.status} • "${opportunity?.title || 'a job'}"`,
        timestamp: app.created_at,
        data: { application_id: app._id, job_title: opportunity?.title }
      });
    });
  }

  if (userRoles.includes("buyer")) {
    // Recent product listings
    const recentProducts = await Product.find({ seller_id: decoded.sub })
      .sort({ created_at: -1 })
      .limit(limit / 3)
      .lean();

    recentProducts.forEach(product => {
      activities.push({
        type: 'product_listed',
        title: 'Product Listed',
        description: `Listed "${product.title}"`,
        timestamp: product.created_at,
        data: { product_id: product._id, product_title: product.title }
      });
    });

    // Recent orders placed
    const recentOrders = await Order.find({ buyer_id: decoded.sub })
      .populate('product_id', 'title')
      .sort({ created_at: -1 })
      .limit(limit / 3)
      .lean();

    recentOrders.forEach((order: any) => {
      const product = typeof order.product_id === 'object' ? order.product_id : null;
      activities.push({
        type: 'order_placed',
        title: 'Order Placed',
        description: `Ordered "${product?.title || 'Product'}"`,
        timestamp: order.created_at,
        data: { order_id: order._id, product_title: product?.title }
      });
    });

    // Recent orders received (as seller)
    const receivedOrders = await Order.find({ seller_id: decoded.sub })
      .populate('product_id', 'title')
      .populate('buyer_id', 'full_name')
      .sort({ created_at: -1 })
      .limit(limit / 3)
      .lean();

    receivedOrders.forEach((order: any) => {
      const buyer = typeof order.buyer_id === 'object' ? order.buyer_id : null;
      const product = typeof order.product_id === 'object' ? order.product_id : null;
      activities.push({
        type: 'order_received',
        title: 'Order Received',
        description: `${buyer?.full_name || 'A buyer'} ordered "${product?.title || 'Product'}"`,
        timestamp: order.created_at,
        data: { order_id: order._id, product_title: product?.title }
      });
    });
  }

  // Common activities for all users
  
  // Recent reviews received
  const recentReviews = await Review.find({ reviewee_id: decoded.sub, status: "active" })
    .populate('reviewer_id', 'full_name')
    .sort({ created_at: -1 })
    .limit(3)
    .lean();

  recentReviews.forEach((review: any) => {
    const reviewer = typeof review.reviewer_id === 'object' ? review.reviewer_id : null;
    activities.push({
      type: 'review_received',
      title: 'Review Received',
      description: `${reviewer?.full_name || 'Someone'} gave you ${review.rating} stars`,
      timestamp: review.created_at,
      data: { review_id: review._id, rating: review.rating }
    });
  });

  // Recent forum activity
  const recentThreads = await ForumThread.find({ author_id: decoded.sub, status: "active" })
    .sort({ created_at: -1 })
    .limit(2)
    .lean();

  recentThreads.forEach(thread => {
    activities.push({
      type: 'thread_created',
      title: 'Thread Created',
      description: `Created thread "${thread.title}"`,
      timestamp: thread.created_at,
      data: { thread_id: thread._id, thread_title: thread.title }
    });
  });

  // Sort all activities by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limitedActivities = activities.slice(0, limit);

  return jsonOk({ activities: limitedActivities });
}
