import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import mongoose from "mongoose";
import { Review } from "@/server/models/Review";
import { User } from "@/server/models/User";
import { z } from "zod";

// Ensure User model is registered at module load time
if (typeof mongoose !== 'undefined' && !mongoose.models.User) {
  void User;
}

const UpdateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const { id } = await params;
  await connectToDatabase();
  
  // Ensure User model is registered before populate
  if (!mongoose.models.User) {
    void User;
  }
  
  const review = await Review.findById(id)
    .populate('reviewer_id', 'full_name avatar_url')
    .populate('reviewee_id', 'full_name avatar_url')
    .lean();

  if (!review) return jsonError("Review not found", 404);

  return jsonOk({ review });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  // Ensure User model is registered before populate
  if (!mongoose.models.User) {
    void User;
  }
  
  const review = await Review.findById(id);
  if (!review) return jsonError("Review not found", 404);

  // Check if user owns this review
  if (review.reviewer_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  const validate = validateBody(UpdateReviewSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const updatedReview = await Review.findByIdAndUpdate(
    id,
    { $set: result.data },
    { new: true }
  )
  .populate('reviewer_id', 'full_name avatar_url')
  .populate('reviewee_id', 'full_name avatar_url');

  return jsonOk({ review: updatedReview });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  const review = await Review.findById(id);
  if (!review) return jsonError("Review not found", 404);

  // Check if user owns this review
  if (review.reviewer_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  // Soft delete by setting status to hidden
  await Review.findByIdAndUpdate(id, {
    $set: { status: "hidden" }
  });

  return jsonOk({ message: "Review deleted successfully" });
}
