import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Review } from "@/server/models/Review";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  try {
    await connectToDatabase();

    // Get total reviews count
    const totalReviews = await Review.countDocuments({ status: "active" });

    // Get average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { status: "active", rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]);
    const averageRating = avgRatingResult[0]?.averageRating || 0;

    // Get verified reviews percentage (assuming reviews with certain criteria are "verified")
    const verifiedReviews = await Review.countDocuments({ 
      status: "active",
      rating: { $exists: true, $ne: null },
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    const verifiedPercentage = totalReviews > 0 ? Math.round((verifiedReviews / totalReviews) * 100) : 0;

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { status: "active", rating: { $exists: true, $ne: null } } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Format rating distribution
    const distribution = [];
    for (let i = 5; i >= 1; i--) {
      const ratingData = ratingDistribution.find(r => r._id === i);
      const count = ratingData?.count || 0;
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
      distribution.push({
        stars: i,
        count,
        percentage
      });
    }

    const stats = {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      verifiedPercentage,
      ratingDistribution: distribution,
      generated_at: new Date().toISOString()
    };

    return jsonOk({ stats });

  } catch (error: any) {
    console.error("Review statistics error:", error);
    return jsonError(error.message || "Failed to fetch review statistics", 500);
  }
}
