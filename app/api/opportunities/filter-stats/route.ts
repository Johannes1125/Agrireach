import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity } from "@/server/models/Job";
import { jsonOk, jsonError } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get current date and 7 days ago
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count jobs by type
    const jobTypes = await Opportunity.aggregate([
      { $group: { _id: "$job_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count jobs by category
    const categories = await Opportunity.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count jobs by experience level
    const experience = await Opportunity.aggregate([
      { $group: { _id: "$experience_level", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count jobs by urgency
    const urgency = await Opportunity.aggregate([
      { $group: { _id: "$urgency", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get pay range statistics
    const payStats = await Opportunity.aggregate([
      {
        $group: {
          _id: null,
          minPay: { $min: "$pay_rate" },
          maxPay: { $max: { $ifNull: ["$pay_rate_max", "$pay_rate"] } },
          avgMinPay: { $avg: "$pay_rate" },
          avgMaxPay: { $avg: { $ifNull: ["$pay_rate_max", "$pay_rate"] } }
        }
      }
    ]);

    const stats = {
      jobTypes: jobTypes.map(item => ({
        id: item._id?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        label: item._id || 'Unknown',
        count: item.count
      })),
      categories: categories.map(item => ({
        id: item._id?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        label: item._id || 'Unknown',
        count: item.count
      })),
      experience: experience.map(item => ({
        id: item._id?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        label: item._id || 'Unknown',
        count: item.count
      })),
      urgency: urgency.map(item => ({
        id: item._id?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        label: item._id || 'Unknown',
        count: item.count
      })),
      payRange: payStats[0] || { minPay: 60, maxPay: 100, avgMinPay: 70, avgMaxPay: 90 }
    };

    return jsonOk(stats);
  } catch (error) {
    console.error("Error fetching filter statistics:", error);
    return jsonError("Failed to fetch filter statistics", 500);
  }
}
