import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { JobApplication } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  
  await connectToDatabase();
  const { id } = await params;
  
  // Check if current user has applied to this job
  const application = await JobApplication.findOne({
    opportunity_id: id,
    worker_id: decoded.sub,
  }).lean();
  
  return jsonOk({ 
    hasApplied: !!application,
    application: application ? {
      id: application._id,
      status: application.status,
      created_at: application.created_at,
    } : null
  });
}

