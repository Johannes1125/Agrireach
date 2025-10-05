import { NextRequest } from "next/server";
import { requireMethod, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Review } from "@/server/models/Review";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const [reviews, total, stats] = await Promise.all([
    Review.find({ 
      reviewee_id: params.id,
      status: "active"
    })
    .populate('reviewer_id', 'full_name avatar_url')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
    Review.countDocuments({ 
      reviewee_id: params.id,
      status: "active"
    }),
    Review.aggregate([
      { $match: { reviewee_id: params.id, status: "active" } },
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
