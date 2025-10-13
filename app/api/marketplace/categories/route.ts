import { NextRequest } from "next/server";
import { requireMethod, jsonOk, jsonError } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Product } from "@/server/models/Product";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  try {
    await connectToDatabase();

    // Try aggregation first
    try {
      const categories = await Product.aggregate([
        { $match: { status: "active" } },
        { $group: { 
          _id: "$category", 
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" }
        }},
        { $sort: { count: -1 } },
        { $project: {
          name: "$_id",
          count: 1,
          avgPrice: { $round: ["$avgPrice", 2] },
          _id: 0
        }}
      ]);

      console.log("Categories fetched successfully:", categories.length);
      return jsonOk({ categories });
    } catch (aggError) {
      console.warn("Aggregation failed, falling back to simple query:", aggError);
      
      // Fallback: simple distinct query
      const categories = await Product.distinct("category", { status: "active" });
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await Product.countDocuments({ category, status: "active" });
          const avgPriceResult = await Product.aggregate([
            { $match: { category, status: "active" } },
            { $group: { _id: null, avgPrice: { $avg: "$price" } } }
          ]);
          
          return {
            name: category,
            count,
            avgPrice: avgPriceResult[0]?.avgPrice ? Math.round(avgPriceResult[0].avgPrice * 100) / 100 : 0
          };
        })
      );
      
      return jsonOk({ categories: categoriesWithCount.sort((a, b) => b.count - a.count) });
    }
  } catch (error: any) {
    console.error("Categories API error:", error);
    return jsonError(error.message || "Failed to fetch categories", 500);
  }
}
