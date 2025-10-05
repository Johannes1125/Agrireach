import { NextRequest } from "next/server";
import { requireMethod, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Product } from "@/server/models/Product";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();

  // Get all unique categories with product counts
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

  return jsonOk({ categories });
}
