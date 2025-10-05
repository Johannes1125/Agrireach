import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity, JobApplication } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { UpdateApplicationSchema } from "@/server/validators/opportunitySchemas";
import { Notification } from "@/server/models/Notification";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();

  const application = await JobApplication.findById(params.id);
  if (!application) return jsonError("Application not found", 404);

  const opportunity = await Opportunity.findById(application.opportunity_id);
  if (!opportunity) return jsonError("Opportunity not found", 404);

  if (String(opportunity.recruiter_id) !== decoded.sub && decoded.role !== "admin") {
    return jsonError("Forbidden", 403);
  }

  const validate = validateBody(UpdateApplicationSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const updatedApplication = await JobApplication.findByIdAndUpdate(
    params.id,
    { $set: result.data },
    { new: true }
  ).populate('worker_id', 'full_name email');

  // Send notification to applicant about status change
  if (result.data.status && updatedApplication) {
    await Notification.create({
      user_id: application.worker_id,
      type: 'application_update',
      title: 'Application Status Updated',
      message: `Your application for "${opportunity.title}" has been ${result.data.status}`,
      priority: 'medium',
      action_url: `/opportunities/${opportunity._id}`
    });
  }

  return jsonOk({ application: updatedApplication });
}


