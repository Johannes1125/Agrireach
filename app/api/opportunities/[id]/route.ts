import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity } from "@/server/models/Job";
import {
  jsonOk,
  jsonError,
  requireMethod,
  getAuthToken,
} from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { UpdateJobSchema } from "@/server/validators/opportunitySchemas";
import { normalizeSkillRequirements } from "@/lib/skills";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  
  const { id } = await params;
  
  await connectToDatabase();

  // Increment view count and get opportunity with recruiter info
  const opportunity = await Opportunity.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("recruiter_id", "full_name email location")
    .lean();

  if (!opportunity) return jsonError("Opportunity not found", 404);

  const opportunityWithSkills = {
    ...opportunity,
    required_skills: normalizeSkillRequirements(opportunity.required_skills as any),
  };

  return jsonOk({ opportunity: opportunityWithSkills });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  
  const { id } = await params;
  
  await connectToDatabase();
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) return jsonError("Opportunity not found", 404);
  if (
    String(opportunity.recruiter_id) !== decoded.sub &&
    decoded.role !== "admin"
  )
    return jsonError("Forbidden", 403);
  const validate = validateBody(UpdateJobSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const updatePayload: any = { ...result.data };
  if (updatePayload.required_skills) {
    updatePayload.required_skills = normalizeSkillRequirements(updatePayload.required_skills as any);
  }

  const updatedOpportunity = await Opportunity.findByIdAndUpdate(
    id,
    { $set: updatePayload },
    { new: true }
  ).populate("recruiter_id", "full_name email location");
  const normalizedUpdated = updatedOpportunity
    ? {
        ...updatedOpportunity.toObject(),
        required_skills: normalizeSkillRequirements(updatedOpportunity.required_skills as any),
      }
    : null;
  return jsonOk({ opportunity: normalizedUpdated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  
  const { id } = await params;
  
  await connectToDatabase();
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) return jsonError("Opportunity not found", 404);
  if (
    String(opportunity.recruiter_id) !== decoded.sub &&
    decoded.role !== "admin"
  )
    return jsonError("Forbidden", 403);
  await Opportunity.findByIdAndDelete(id);
  return jsonOk({ message: "Opportunity deleted successfully" });
}
