import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity, JobApplication } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
  
  const opportunity = await Opportunity.findById(params.id);
  if (!opportunity) return jsonError("Not found", 404);
  if (String(opportunity.recruiter_id) !== decoded.sub && decoded.role !== "admin") {
    return jsonError("Forbidden", 403);
  }
  
  // Fetch applications with populated worker information
  const apps = await JobApplication.find({ opportunity_id: params.id })
    .populate('worker_id', 'full_name email phone avatar_url trust_score location')
    .sort({ created_at: -1 })
    .lean();
  
  // Format the response
  const formattedApps = apps.map((app: any) => ({
    _id: app._id,
    worker: {
      _id: app.worker_id?._id,
      full_name: app.worker_id?.full_name || 'Unknown Worker',
      email: app.worker_id?.email || '',
      phone: app.worker_id?.phone || '',
      avatar_url: app.worker_id?.avatar_url || '',
      trust_score: app.worker_id?.trust_score || 0,
      location: app.worker_id?.location || ''
    },
    status: app.status,
    cover_letter: app.cover_letter,
    resume_url: app.resume_url,
    created_at: app.created_at
  }));
  
  return jsonOk({ applications: formattedApps });
}


