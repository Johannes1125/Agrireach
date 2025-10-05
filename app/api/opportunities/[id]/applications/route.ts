import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job, JobApplication } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const job = await Job.findById(params.id);
  if (!job) return jsonError("Not found", 404);
  if (String(job.recruiter_id) !== decoded.sub && decoded.role !== "admin") return jsonError("Forbidden", 403);
  const apps = await JobApplication.find({ job_id: params.id }).sort({ created_at: -1 }).lean();
  return jsonOk({ items: apps });
}


