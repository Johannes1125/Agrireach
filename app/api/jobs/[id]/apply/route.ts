import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job, JobApplication } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  const job = await Job.findById(params.id).lean();
  if (!job || job.status !== "open") return jsonError("Job not available", 400);

  // Prevent users from applying to their own job postings
  if (String(job.recruiter_id) === decoded.sub) {
    return jsonError("You cannot apply to your own job posting", 400);
  }

  const body = await req.json();
  const { cover_letter, resume_url } = body || {};

  await JobApplication.create({ job_id: job._id, worker_id: decoded.sub, cover_letter, resume_url });
  return jsonOk({});
}
