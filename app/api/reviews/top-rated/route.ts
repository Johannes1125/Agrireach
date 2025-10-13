import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { Review } from "@/server/models/Review";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  try {
    await connectToDatabase();

    // Get top-rated users this month based on reviews
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    currentMonth.setHours(0, 0, 0, 0);

    const topRatedUsers = await Review.aggregate([
      {
        $match: {
          created_at: { $gte: currentMonth },
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$reviewee_id",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          totalRating: { $sum: "$rating" }
        }
      },
      {
        $match: {
          totalReviews: { $gte: 3 } // At least 3 reviews to be considered
        }
      },
      {
        $sort: { 
          averageRating: -1,
          totalReviews: -1 
        }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          name: "$user.full_name",
          avatar: "$user.avatar_url",
          averageRating: { $round: ["$averageRating", 1] },
          totalReviews: 1,
          location: "$user.location"
        }
      }
    ]);

    // Format the data
    const formattedUsers = topRatedUsers.map((user, index) => ({
      id: user._id,
      name: user.name || "Unknown User",
      avatar: user.avatar || "",
      rating: user.averageRating,
      reviews: user.totalReviews,
      location: user.location || "",
      rank: index + 1
    }));

    return jsonOk({ 
      topRated: formattedUsers,
      period: "this_month",
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Top rated users error:", error);
    return jsonError(error.message || "Failed to fetch top rated users", 500);
  }
}
