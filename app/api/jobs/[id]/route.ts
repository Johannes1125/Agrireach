import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const job = await Job.findById(id).lean();
  if (!job) return jsonError("Not found", 404);
  return jsonOk(job);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  const job = await Job.findById(id);
  if (!job) return jsonError("Not found", 404);
  if (String(job.recruiter_id) !== decoded.sub && decoded.role !== "admin") {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json();
  const updatable = ["title","description","location","job_type","pay_range","urgency","deadline","skills_required","status"] as const;
  for (const key of updatable) {
    if (key in body) (job as any)[key] = body[key];
  }
  await job.save();
  return jsonOk({});
}
