import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity } from "@/server/models/Job";
import { User } from "@/server/models/User";
import { UserProfile } from "@/server/models/UserProfile";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { CreateJobSchema } from "@/server/validators/opportunitySchemas";
import { notifyAllUsersNewJob } from "@/server/utils/notifications";
import { validateUserRole } from "@/server/utils/role-validation";
import { calculateMatchScore as calculateEnhancedMatchScore, normalizeSkills, normalizeSkillRequirements } from "@/lib/skills";

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
  
  // Get user's skills if authenticated
  let workerSkills: any[] = [];
  try {
    const token = getAuthToken(req, "access");
    if (token) {
      const decoded = verifyToken<any>(token, "access");
      const profile = await UserProfile.findOne({ user_id: decoded.sub }).lean();
      if (profile?.skills && Array.isArray(profile.skills)) {
        workerSkills = normalizeSkills(profile.skills);
      }
    }
  } catch (error) {
    // If token is invalid or missing, just continue without skill matching
    console.error("Error fetching user skills:", error);
  }
  
  const [items, total] = await Promise.all([
    Opportunity.find(filter)
      .populate('recruiter_id', 'full_name location verified')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Opportunity.countDocuments(filter),
  ]);
  
  // Calculate match scores for each job using enhanced algorithm
  const itemsWithMatchScores = items.map((item: any) => {
    const normalizedRequirements = normalizeSkillRequirements(item.required_skills as any);
    const matchResult = calculateEnhancedMatchScore(normalizedRequirements, workerSkills);
    return {
      ...item,
      required_skills: normalizedRequirements,
      matchScore: matchResult.score,
      matchDetails: matchResult, // Include detailed match info
    };
  });
  
  // Sort by match score if requested (via sortBy query param)
  const sortBy = q.get("sortBy");
  if (sortBy === "match" && workerSkills.length > 0) {
    itemsWithMatchScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }
  
  return jsonOk({ items: itemsWithMatchScores, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  
  // Validate user has recruiter role
  let userId: string;
  try {
    const { user, userId: validatedUserId } = await validateUserRole(req, ["recruiter"]);
    userId = validatedUserId;
  } catch (error: any) {
    return jsonError(error.message, 403);
  }
  
  const validate = validateBody(CreateJobSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const normalizedSkills = normalizeSkillRequirements(result.data.required_skills);
  const job = await Opportunity.create({
    ...result.data,
    recruiter_id: userId,
    required_skills: normalizedSkills,
  });
  
  // Get recruiter info for notification
  const recruiter = await User.findById(userId).select("full_name company_name").lean();
  const companyName = result.data.company_name || recruiter?.full_name || "A company";
  
  // Notify all users about new job posting (don't await to avoid slowing down the response)
  notifyAllUsersNewJob(result.data.title, companyName, result.data.location, job._id.toString()).catch(err => 
    console.error("Failed to send job notifications:", err)
  );
  
  return jsonOk({ id: job._id });
}


