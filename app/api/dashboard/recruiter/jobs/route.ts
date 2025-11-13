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

  await connectToDatabase()

  try {
    // Fetch all active jobs posted by this recruiter
    const jobs = await Opportunity.find({ 
      recruiter_id: decoded.sub, 
      status: "active" 
    })
      .sort({ created_at: -1 })
      .lean()

    // For each job, get the applicant count
    const jobsWithApplicants = await Promise.all(
      jobs.map(async (job: any) => {
        const applicantCount = await JobApplication.countDocuments({
          opportunity_id: job._id
        })

        return {
          _id: job._id,
          title: job.title,
          location: job.location,
          jobType: job.job_type || job.category,
          urgency: job.urgency || "medium",
          salary_range: job.salary_range || (job.pay_rate ? { min: job.pay_rate, max: job.pay_rate_max || job.pay_rate } : null),
          created_at: job.created_at,
          status: job.status,
          applicantCount
        }
      })
    )

    return jsonOk({ jobs: jobsWithApplicants })
  } catch (error: any) {
    console.error("Error fetching recruiter jobs:", error)
    return jsonError(error.message || "Failed to fetch jobs", 500)
  }
}

