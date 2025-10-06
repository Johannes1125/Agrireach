import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job, JobApplication } from "@/server/models/Job";
import { User } from "@/server/models/User";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { ApplyJobSchema } from "@/server/validators/opportunitySchemas";
import { notifyJobApplication } from "@/server/utils/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const { id } = await params;
  const job = await Job.findById(id);
  if (!job) return jsonError("Not found", 404);
  
  // Prevent users from applying to their own job postings
  if (String(job.recruiter_id) === decoded.sub) {
    return jsonError("You cannot apply to your own job posting", 400);
  }
  
  const validate = validateBody(ApplyJobSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const app = await JobApplication.create({ opportunity_id: job._id, worker_id: decoded.sub, ...result.data });
  await Job.findByIdAndUpdate(job._id, { $inc: { applications_count: 1 } });

  // Get applicant info and notify recruiter
  const applicant = await User.findById(decoded.sub).select("full_name").lean();
  if (applicant) {
    await notifyJobApplication(
      job.recruiter_id.toString(),
      applicant.full_name,
      job.title,
      job._id.toString()
    );
  }

  return jsonOk({ id: app._id });
}


