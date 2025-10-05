import { NextRequest } from "next/server";
import { requireMethod, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Farmer } from "@/server/models/Farmer";
import { User } from "@/server/models/User";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty");
  const location = searchParams.get("location");
  const minRating = searchParams.get("minRating");
  const minExperience = searchParams.get("minExperience");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  // Build aggregation pipeline
  const pipeline: any[] = [
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $match: {
        "user.status": "active"
      }
    }
  ];

  // Add filters
  const matchConditions: any = {};
  if (specialty) matchConditions.specialty = { $regex: specialty, $options: "i" };
  if (location) matchConditions["user.location"] = { $regex: location, $options: "i" };
  if (minRating) matchConditions.rating = { $gte: parseFloat(minRating) };
  if (minExperience) matchConditions.experience_years = { $gte: parseInt(minExperience) };

  if (Object.keys(matchConditions).length > 0) {
    pipeline.push({ $match: matchConditions });
  }

  // Add sorting, pagination, and projection
  pipeline.push(
    { $sort: { rating: -1, reviews_count: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        user_id: 1,
        specialty: 1,
        experience_years: 1,
        farm_size: 1,
        certifications: 1,
        rating: 1,
        reviews_count: 1,
        response_time: 1,
        completion_rate: 1,
        created_at: 1,
        "user.full_name": 1,
        "user.location": 1,
        "user.avatar_url": 1,
        "user.verified": 1
      }
    }
  );

  const [farmers, totalPipeline] = await Promise.all([
    Farmer.aggregate(pipeline),
    Farmer.aggregate([
      ...pipeline.slice(0, -3), // Remove sort, skip, limit, project
      { $count: "total" }
    ])
  ]);

  const total = totalPipeline[0]?.total || 0;

  return jsonOk({ 
    farmers, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
  });
}
