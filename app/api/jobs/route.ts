import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

function parseIntSafe(v?: string | null) {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const category = searchParams.get("category"); // optional if you tag as category
  const page = parseIntSafe(searchParams.get("page")) || 1;
  const pageSize = Math.min(parseIntSafe(searchParams.get("pageSize")) || 20, 100);

  const filter: any = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const items = await Job.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
  const total = await Job.countDocuments(filter);

  return jsonOk({ items, page, pageSize, total });
}

export async function POST(req: NextRequest) {
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
  const body = await req.json();

  const { title, description, location, job_type, pay_range, urgency, deadline, skills_required, status } = body || {};
  if (!title || !description) return jsonError("Missing required fields", 400);

  const doc = await Job.create({
    recruiter_id: decoded.sub,
    title,
    description,
    location,
    job_type,
    pay_range,
    urgency,
    deadline,
    skills_required: Array.isArray(skills_required) ? skills_required : [],
    status: status || "open",
  });

  return jsonOk({ id: doc._id });
}
