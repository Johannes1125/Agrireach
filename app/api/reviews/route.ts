import { NextRequest } from "next/server";
import { requireMethod, jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Review } from "@/server/models/Review";
import { User } from "@/server/models/User";
import { notifyReviewReceived } from "@/server/utils/notifications";
import { z } from "zod";

const CreateReviewSchema = z.object({
  reviewee_id: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const reviewee_id = searchParams.get("reviewee_id");
  const reviewer_id = searchParams.get("reviewer_id");
  const category = searchParams.get("category");
  const rating = searchParams.get("rating");
  const status = searchParams.get("status") || "active";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter: any = { status };
  if (reviewee_id) filter.reviewee_id = reviewee_id;
  if (reviewer_id) filter.reviewer_id = reviewer_id;
  if (category) filter.category = category;
  if (rating) filter.rating = parseInt(rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewer_id', 'full_name avatar_url')
      .populate('reviewee_id', 'full_name avatar_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter)
  ]);

  return jsonOk({ 
    reviews, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
  });
}

export async function POST(req: NextRequest) {
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

  const { reviewee_id, rating, title, comment, category } = result.data;

  await connectToDatabase();

  // Check if user is trying to review themselves
  if (reviewee_id === decoded.sub) {
    return jsonError("Cannot review yourself", 400);
  }

  // Check if user has already reviewed this person
  const existingReview = await Review.findOne({
    reviewer_id: decoded.sub,
    reviewee_id
  });

  if (existingReview) {
    return jsonError("You have already reviewed this user", 400);
  }

  // Create review
  const review = await Review.create({
    reviewer_id: decoded.sub,
    reviewee_id,
    rating,
    title,
    comment,
    category,
    verified_purchase: false, // Could be enhanced to check for actual transactions
  });

  // Get reviewer info and notify reviewee
  const reviewer = await User.findById(decoded.sub).select("full_name").lean();
  if (reviewer) {
    await notifyReviewReceived(
      reviewee_id,
      reviewer.full_name,
      rating,
      review._id.toString()
    );
  }

  const populatedReview = await Review.findById(review._id)
    .populate('reviewer_id', 'full_name avatar_url')
    .populate('reviewee_id', 'full_name avatar_url')
    .lean();

  return jsonOk({
    review: populatedReview,
    message: "Review submitted successfully"
  });
}
