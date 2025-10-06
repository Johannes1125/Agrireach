import { NextRequest } from "next/server"
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { Opportunity, JobApplication } from "@/server/models/Job"

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"])
  if (mm) return mm

  const token = getAuthToken(req, "access")
  if (!token) return jsonError("Unauthorized", 401)

  let decoded: any
  try {
    decoded = verifyToken<any>(token, "access")
  } catch {
    return jsonError("Unauthorized", 401)
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "10")

  await connectToDatabase()

  try {
    // Get all job IDs posted by this recruiter
    const jobIds = await Opportunity.find({ recruiter_id: decoded.sub }).distinct('_id')

    // Fetch recent applications to these jobs
    const applications = await JobApplication.find({
      opportunity_id: { $in: jobIds }
    })
      .populate('worker_id', 'full_name avatar_url trust_score')
      .populate('opportunity_id', 'title')
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()

    const formattedApplicants = applications.map((app: any) => ({
      _id: app._id,
      worker: {
        full_name: app.worker_id?.full_name || 'Unknown Worker',
        avatar_url: app.worker_id?.avatar_url || '',
        trust_score: app.worker_id?.trust_score || 0
      },
      opportunity: {
        title: app.opportunity_id?.title || 'Unknown Job'
      },
      status: app.status,
      created_at: app.created_at
    }))

    return jsonOk({ applicants: formattedApplicants })
  } catch (error: any) {
    console.error("Error fetching recruiter applicants:", error)
    return jsonError(error.message || "Failed to fetch applicants", 500)
  }
}

