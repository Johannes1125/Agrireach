import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity } from "@/server/models/Job";
import { User } from "@/server/models/User";
import { jsonOk, jsonError } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get current date and 7 days ago
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count active jobs (not expired)
    const activeJobs = await Opportunity.countDocuments({
      deadline: { $gt: now },
      status: { $ne: "closed" }
    });

    // Count new jobs this week
    const newJobsThisWeek = await Opportunity.countDocuments({
      created_at: { $gte: oneWeekAgo }
    });

    // Count unique companies hiring (recruiters who have posted jobs)
    const companiesHiring = await Opportunity.distinct("recruiter_id");

    const stats = {
      activeJobs,
      newJobsThisWeek,
      companiesHiring: companiesHiring.length
    };

    return jsonOk(stats);
  } catch (error) {
    console.error("Error fetching job statistics:", error);
    return jsonError("Failed to fetch statistics", 500);
  }
}
