import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { CreateJobSchema } from "@/server/validators/opportunitySchemas";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();
  const url = new URL(req.url);
  const q = url.searchParams;
  const filter: any = {};
  if (q.get("requirements")) filter.requirements = { $regex: q.get("requirements") as string, $options: "i" };
  if (q.get("company_name")) filter.company_name = { $regex: q.get("company_name") as string, $options: "i" };
  if (q.get("category")) filter.category = q.get("category");
  if (q.get("location")) filter.location = { $regex: q.get("location") as string, $options: "i" };
  if (q.get("pay_type")) filter.pay_type = q.get("pay_type");
  if (q.get("benefits")) filter.benefits = { $regex: q.get("benefits") as string, $options: "i" };
  if (q.get("urgency")) filter.urgency = q.get("urgency");
  if (q.get("status")) filter.status = q.get("status");
  if (q.get("contact_email")) filter.contact_email = { $regex: q.get("contact_email") as string, $options: "i" };
  if (q.get("q")) filter.$text = { $search: q.get("q") as string };
  const page = parseInt(q.get("page") || "1", 10);
  const limit = Math.min(parseInt(q.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Opportunity.find(filter)
      .populate('recruiter_id', 'full_name location verified')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Opportunity.countDocuments(filter),
  ]);
  return jsonOk({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const validate = validateBody(CreateJobSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const job = await Opportunity.create({ ...result.data, recruiter_id: decoded.sub });
  return jsonOk({ id: job._id });
}


