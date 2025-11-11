import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job, JobApplication } from "@/server/models/Job";
import { User } from "@/server/models/User";
import { UserProfile } from "@/server/models/UserProfile";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { ApplyJobSchema } from "@/server/validators/opportunitySchemas";
import { notifyJobApplication } from "@/server/utils/notifications";
import { validateUserRole } from "@/server/utils/role-validation";
import {
  calculateMatchScore,
  normalizeSkillRequirements,
  normalizeSkills,
} from "@/lib/skills";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  
  // Validate user has worker role
  let userId: string;
  try {
    const { user, userId: validatedUserId } = await validateUserRole(req, ["worker"]);
    userId = validatedUserId;
  } catch (error: any) {
    return jsonError(error.message, 403);
  }
  
  await connectToDatabase();
  const { id } = await params;
  
  const job = await Job.findById(id);
  if (!job) return jsonError("Not found", 404);
  
  // Prevent users from applying to their own job postings
  if (String(job.recruiter_id) === userId) {
    return jsonError("You cannot apply to your own job posting", 400);
  }

  // Check if user has already applied
  const existingApplication = await JobApplication.findOne({
    opportunity_id: job._id,
    worker_id: userId,
  });
  if (existingApplication) {
    return jsonError("You have already applied for this job", 400);
  }
  
  const validate = validateBody(ApplyJobSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  const profile = await UserProfile.findOne({ user_id: userId }).lean();
  const workerSkills = normalizeSkills(profile?.skills as any);
  const jobSkillRequirements = normalizeSkillRequirements(job.required_skills as any);
  const matchResult = calculateMatchScore(jobSkillRequirements, workerSkills);

  const unmetRequired = jobSkillRequirements.filter((req) => {
    if (req.required === false) return false;
    const workerSkill = workerSkills.find(
      (ws) => ws.name.toLowerCase() === req.name.toLowerCase()
    );
    if (!workerSkill) return true;
    if (req.min_level && workerSkill.level < req.min_level) return true;
    return false;
  });

  // Allow applications even without required skills
  // Missing skills will still be visible to recruiters in match_details
  if (unmetRequired.length > 0) {
    console.log(`Application submitted with missing required skills: ${unmetRequired.map((req) => req.name).join(", ")}`);
  }

  const { highlighted_skills = [], ...applicationBody } = result.data;
  const highlightedSkills = (highlighted_skills as typeof highlighted_skills).length
    ? highlighted_skills.map((skill) => {
        const workerSkill = workerSkills.find(
          (ws) => ws.name.toLowerCase() === skill.name.toLowerCase()
        );
        return {
          name: skill.name,
          level: skill.level || workerSkill?.level,
        };
      })
    : workerSkills
        .filter((ws) =>
          jobSkillRequirements.some(
            (jr) => jr.name.toLowerCase() === ws.name.toLowerCase()
          )
        )
        .map((ws) => ({ name: ws.name, level: ws.level }));

  try {
    const app = await JobApplication.create({
      opportunity_id: job._id,
      worker_id: userId,
      ...applicationBody,
      highlighted_skills: highlightedSkills,
      match_score: matchResult.score,
      match_details: matchResult.details,
    });
    await Job.findByIdAndUpdate(job._id, { $inc: { applications_count: 1 } });

    // Get applicant info and notify recruiter
    const applicant = await User.findById(userId).select("full_name").lean();
    if (applicant) {
      await notifyJobApplication(
        job.recruiter_id.toString(),
        applicant.full_name,
        job.title,
        job._id.toString()
      );
    }

    return jsonOk({ id: app._id });
  } catch (error: any) {
    console.error("Error creating job application:", error);
    return jsonError(
      error.message || "Failed to create application",
      500
    );
  }
}


