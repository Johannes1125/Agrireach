import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { jsonError, jsonOk, requireMethod } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { getAuthToken } from "@/server/utils/api";
import mongoose, { Types } from "mongoose";
import { Review } from "@/server/models/Review";
import { User } from "@/server/models/User";
import { notifyReviewReceived } from "@/server/utils/notifications";
import { z } from "zod";

const CreateReviewSchema = z
  .object({
    reviewee_id: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/u, { message: "Invalid reviewee id" })
      .optional(),
    reviewee_name: z.string().min(1).optional(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
    category: z.string().optional(),
  })
  .refine((d) => !!d.reviewee_id || !!d.reviewee_name, {
    message: "Provide reviewee_id or reviewee_name",
    path: ["reviewee_id"],
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
      .populate("reviewer_id", "full_name avatar_url")
      .populate("reviewee_id", "full_name avatar_url")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return jsonOk({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// helper to coerce any string to a valid ObjectId
function toObjectIdOrFallback(value?: string): Types.ObjectId {
  if (typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value)) {
    return new Types.ObjectId(value);
  }
  // fallback stable ID for demo selections like "1", "2", "3"
  return new Types.ObjectId("000000000000000000000000");
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  try {
    await connectToDatabase();

    const token = getAuthToken(req, "access");
    if (!token) return jsonError("Unauthorized", 401);

    let decoded: any;
    try {
      decoded = verifyToken<any>(token, "access");
    } catch {
      return jsonError("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));
    const {
      reviewee_id,
      rating,
      title,
      comment,
      category,
      reviewee_name, 
    } = body || {};

    const numericRating = Number(rating);
    if (
      !numericRating ||
      isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return jsonError("Rating must be between 1 and 5", 400);
    }
    if (!title || !comment || !category) {
      return jsonError("Title, comment, and category are required", 400);
    }

    const revieweeObjectId = toObjectIdOrFallback(reviewee_id);

    if (
      decoded?.sub &&
      Types.ObjectId.isValid(decoded.sub) &&
      revieweeObjectId.equals(new Types.ObjectId(decoded.sub))
    ) {
      return jsonError("Cannot review yourself", 400);
    }

    const doc = await Review.create({
      reviewer_id: new Types.ObjectId(decoded.sub),
      reviewee_id: revieweeObjectId,
      rating: numericRating,
      title,
      comment,
      category,
      verified_purchase: false,
    });

    const review = await Review.findById(doc._id).lean();

    return jsonOk({
      message: "Review submitted successfully",
      review,
    });
  } catch (err: any) {
    const msg =
      err?.name === "ValidationError"
        ? "Validation failed"
        : err?.message || "Internal server error";
    return jsonError(msg, 500);
  }
}
