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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();

  // Increment view count and get opportunity with recruiter info
  const opportunity = await Opportunity.findByIdAndUpdate(
    params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("recruiter_id", "full_name email location")
    .lean();

  if (!opportunity) return jsonError("Opportunity not found", 404);

  // Debug: Log the actual data being returned
  console.log(
    "DEBUG - Full opportunity data:",
    JSON.stringify(opportunity, null, 2)
  );

  return jsonOk({ opportunity });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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
  await connectToDatabase();
  const opportunity = await Opportunity.findById(params.id);
  if (!opportunity) return jsonError("Opportunity not found", 404);
  if (
    String(opportunity.recruiter_id) !== decoded.sub &&
    decoded.role !== "admin"
  )
    return jsonError("Forbidden", 403);
  const validate = validateBody(UpdateJobSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const updatedOpportunity = await Opportunity.findByIdAndUpdate(
    params.id,
    { $set: result.data },
    { new: true }
  ).populate("recruiter_id", "full_name email location");
  return jsonOk({ opportunity: updatedOpportunity });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
  await connectToDatabase();
  const opportunity = await Opportunity.findById(params.id);
  if (!opportunity) return jsonError("Opportunity not found", 404);
  if (
    String(opportunity.recruiter_id) !== decoded.sub &&
    decoded.role !== "admin"
  )
    return jsonError("Forbidden", 403);
  await Opportunity.findByIdAndDelete(params.id);
  return jsonOk({ message: "Opportunity deleted successfully" });
}
