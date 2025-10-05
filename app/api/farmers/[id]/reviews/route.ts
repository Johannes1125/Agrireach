import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Farmer } from "@/server/models/Farmer";
import { Review } from "@/server/models/Review";
import { Notification } from "@/server/models/Notification";
import { z } from "zod";

const CreateReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();
  
  // Get farmer to get user_id
  const farmer = await Farmer.findById(params.id);
  if (!farmer) return jsonError("Farmer not found", 404);

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ 
      reviewee_id: farmer.user_id,
      status: "active"
    })
    .populate('reviewer_id', 'full_name avatar_url')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
    Review.countDocuments({ 
      reviewee_id: farmer.user_id,
      status: "active"
    })
  ]);

  return jsonOk({ 
    reviews, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const validate = validateBody(CreateReviewSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  await connectToDatabase();
  
  // Get farmer to get user_id
  const farmer = await Farmer.findById(params.id).populate('user_id', 'full_name');
  if (!farmer) return jsonError("Farmer not found", 404);

  // Check if user is trying to review themselves
  if (farmer.user_id._id.toString() === decoded.sub) {
    return jsonError("Cannot review yourself", 400);
  }

  // Check if user has already reviewed this farmer
  const existingReview = await Review.findOne({
    reviewer_id: decoded.sub,
    reviewee_id: farmer.user_id._id
  });

  if (existingReview) {
    return jsonError("You have already reviewed this farmer", 400);
  }

  // Create review
  const review = await Review.create({
    reviewer_id: decoded.sub,
    reviewee_id: farmer.user_id._id,
    rating: result.data.rating,
    title: result.data.title,
    comment: result.data.comment,
    category: result.data.category,
    verified_purchase: false, // Could be enhanced to check for actual transactions
  });

  // Update farmer's rating and review count
  const allReviews = await Review.find({ 
    reviewee_id: farmer.user_id._id,
    status: "active"
  });
  
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  
  await Farmer.findByIdAndUpdate(params.id, {
    $set: {
      rating: Math.round(avgRating * 100) / 100,
      reviews_count: allReviews.length
    }
  });

  // Send notification to farmer
  await Notification.create({
    user_id: farmer.user_id._id,
    type: 'new_review',
    title: 'New Review Received',
    message: `You received a ${result.data.rating}-star review`,
    priority: 'low',
    action_url: `/farmers/${farmer._id}`
  });

  const populatedReview = await Review.findById(review._id)
    .populate('reviewer_id', 'full_name avatar_url')
    .lean();

  return jsonOk({ 
    review: populatedReview,
    message: "Review submitted successfully"
  });
}
