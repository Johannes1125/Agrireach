import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { Review } from "@/server/models/Review";

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

  try {
    await connectToDatabase();

    const userId = decoded.sub;

    // Get user's average rating from reviews received
    const ratingResult = await Review.aggregate([
      { $match: { reviewee_id: userId, status: "active" } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]);
    const averageRating = ratingResult[0]?.averageRating || 0;

    // For now, we'll use mock data since we don't have an Order model yet
    // In a real implementation, you would query your Order collection
    const mockStats = {
      totalOrders: 234,
      totalSpent: 3450000, // in centavos
      activeOrders: 12,
      averageRating: Math.round(averageRating * 10) / 10,
    };

    const mockRecentOrders = [
      {
        id: "order_1",
        productName: "Organic Tomatoes",
        supplier: "Green Valley Farms",
        quantity: "500 kg",
        date: "2024-02-20",
        status: "delivered",
        amount: 6000000, // in centavos
      },
      {
        id: "order_2", 
        productName: "Fresh Strawberries",
        supplier: "Berry Best Farm",
        quantity: "200 kg",
        date: "2024-02-18",
        status: "delivered",
        amount: 4000000, // in centavos
      },
      {
        id: "order_3",
        productName: "Organic Lettuce",
        supplier: "Green Valley Farms", 
        quantity: "100 kg",
        date: "2024-02-15",
        status: "processing",
        amount: 2500000, // in centavos
      },
    ];

    return jsonOk({
      stats: mockStats,
      recentOrders: mockRecentOrders,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Buyer stats error:", error);
    return jsonError(error.message || "Failed to fetch buyer statistics", 500);
  }
}
