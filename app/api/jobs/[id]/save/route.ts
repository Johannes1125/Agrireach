import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { SavedJob } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["POST"]);
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
  await SavedJob.updateOne({ job_id: id, user_id: decoded.sub }, { $set: { job_id: id, user_id: decoded.sub } }, { upsert: true });
  return jsonOk({ saved: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["DELETE"]);
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
  await SavedJob.deleteOne({ job_id: id, user_id: decoded.sub });
  return jsonOk({ saved: false });
}
