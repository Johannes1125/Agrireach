import { NextRequest } from "next/server";
import { requireMethod, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import mongoose from "mongoose";
import { Review } from "@/server/models/Review";
import { User } from "@/server/models/User";

// Ensure User model is registered at module load time
if (typeof mongoose !== 'undefined' && !mongoose.models.User) {
  void User;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const { id } = await params;
  await connectToDatabase();

  // Ensure User model is registered before populate
  if (!mongoose.models.User) {
    void User;
  }

  // Convert string ID to ObjectId for proper MongoDB querying (same as detail page)
  const revieweeId = mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id)
    : id;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const [reviews, total, stats] = await Promise.all([
    Review.find({ 
      reviewee_id: revieweeId,
      status: "active"
    })
    .populate('reviewer_id', 'full_name avatar_url')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
    Review.countDocuments({ 
      reviewee_id: revieweeId,
      status: "active"
    }),
    Review.aggregate([
      { $match: { reviewee_id: revieweeId, status: "active" } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ])
  ]);

  // Calculate rating distribution
  let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (stats[0]?.ratingDistribution) {
    stats[0].ratingDistribution.forEach((rating: number) => {
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
    });
  }

  return jsonOk({ 
    reviews, 
    total, 
    page, 
    pages: Math.ceil(total / limit),
    stats: {
      averageRating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      ratingDistribution
    }
  });
}
