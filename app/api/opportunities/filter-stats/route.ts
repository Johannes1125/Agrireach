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

    // Count jobs by type - check multiple fields (duration is the primary field used)
    const jobTypes = await Opportunity.aggregate([
      {
        $project: {
          jobType: {
            $ifNull: [
              "$duration",
              {
                $ifNull: [
                  "$work_type",
                  {
                    $ifNull: [
                      "$employment_type",
                      {
                        $ifNull: ["$job_type", null]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $match: {
          jobType: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: "$jobType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Count jobs by category - filter out null/undefined values
    const categories = await Opportunity.aggregate([
      {
        $match: {
          category: { $exists: true, $nin: [null, ""] }
        }
      },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count jobs by experience level - filter out null/undefined values
    const experience = await Opportunity.aggregate([
      {
        $match: {
          experience_level: { $exists: true, $nin: [null, ""] }
        }
      },
      { $group: { _id: "$experience_level", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count jobs by urgency - filter out null/undefined values
    const urgency = await Opportunity.aggregate([
      {
        $match: {
          urgency: { $exists: true, $nin: [null, ""] }
        }
      },
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

    // Format job type labels nicely
    const formatJobTypeLabel = (type: string | null | undefined): string => {
      if (!type) return 'Unknown';
      // Capitalize first letter and handle hyphens
      return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
    };

    const stats = {
      jobTypes: jobTypes.map(item => {
        const rawType = item._id || null;
        const formattedLabel = formatJobTypeLabel(rawType);
        return {
          id: rawType?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          label: formattedLabel,
          count: item.count
        };
      }),
      categories: categories
        .filter(item => item._id && item._id.trim() !== '')
        .map(item => ({
          id: item._id.toLowerCase().replace(/\s+/g, '-'),
          label: item._id,
          count: item.count
        })),
      experience: experience
        .filter(item => item._id && item._id.trim() !== '')
        .map(item => ({
          id: item._id.toLowerCase().replace(/\s+/g, '-'),
          label: item._id,
          count: item.count
        })),
      urgency: urgency
        .filter(item => item._id && item._id.trim() !== '')
        .map(item => ({
          id: item._id.toLowerCase().replace(/\s+/g, '-'),
          label: item._id,
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
