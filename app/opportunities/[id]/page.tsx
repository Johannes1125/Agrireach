import { JobDetails } from "@/components/opportunities/job-details";
import { JobApplication } from "@/components/opportunities/job-application";
import { SimilarJobs } from "@/components/opportunities/similar-jobs";
import { WriteReviewCard } from "@/components/opportunities/write-review-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Opportunity } from "@/server/models/Job";
import { UserProfile } from "@/server/models/UserProfile";
import { Review } from "@/server/models/Review";
import { normalizeSkillRequirements, normalizeSkills } from "@/lib/skills";
import mongoose from "mongoose";

interface JobPageProps {
  params: Promise<{ id: string }>;
}

async function fetchJob(id: string) {
  await connectToDatabase();

  // Increment view count and get opportunity with recruiter info
  const opportunity = await Opportunity.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("recruiter_id", "full_name email location")
    .lean();

  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  const j = opportunity as any;
  const recruiter = j.recruiter_id ?? {};

  const companyProfile = await UserProfile.findOne({ user_id: j.recruiter_id })
    .lean()
    .catch(() => null);

  const normalizedCompanySkills = normalizeSkills(companyProfile?.skills as any);

  // Fetch review statistics for the company/poster
  let averageRating = 0;
  let totalReviews = 0;
  if (recruiter?._id) {
    try {
      const recruiterId = typeof recruiter._id === 'string' 
        ? new mongoose.Types.ObjectId(recruiter._id)
        : recruiter._id;
      
      const reviewStats = await Review.aggregate([
        {
          $match: {
            reviewee_id: recruiterId,
            status: "active"
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      if (reviewStats.length > 0) {
        averageRating = Math.round((reviewStats[0].averageRating || 0) * 10) / 10;
        totalReviews = reviewStats[0].totalReviews || 0;
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  }

  const postedDate = new Date(j.created_at || Date.now()).toISOString();
  const deadlineDate = j.start_date ? new Date(j.start_date).toISOString() : postedDate;

  return {
    id: String(j._id || id),
    title: j.title,
    company:
      j.company_name ||
      companyProfile?.company_name ||
      (recruiter?.full_name
        ? `${recruiter.full_name}'s Company`
        : "Company"),
    location: companyProfile?.business_address || j.location,
    type: j.duration || j.pay_type || "",
    payRange: ((): string => {
      const hasMin = typeof j.pay_rate === "number" && j.pay_rate > 0
      const hasMax = typeof j.pay_rate_max === "number" && j.pay_rate_max > j.pay_rate
      if (!hasMin) return ""
      const base = hasMax ? `₱${j.pay_rate}–₱${j.pay_rate_max}` : `₱${j.pay_rate}`
      return j.pay_type ? `${base}/${j.pay_type}` : base
    })(),
    description: j.description,
    companyLogo: j.company_logo || companyProfile?.business_logo || "",
    images: Array.isArray(j.images) ? j.images : [],
    poster: recruiter?._id || recruiter?.full_name
      ? {
          id: String(recruiter._id || ""),
          name: recruiter.full_name,
          location: companyProfile?.business_address || recruiter.location,
        }
      : undefined,
    requirements: Array.isArray(j.requirements) ? j.requirements : [],
    benefits: Array.isArray(j.benefits) ? j.benefits : [],
    postedDate,
    deadline: deadlineDate,
    urgency: j.urgency,
    skills: normalizeSkillRequirements(j.required_skills as any),
    schedule: j.work_schedule || "",
    companyInfo: {
      name: j.company_name || companyProfile?.company_name || "",
      size: companyProfile?.company_size || "",
      industry: companyProfile?.industry || "",
      phone: companyProfile?.phone || "",
      website: companyProfile?.website || "",
      address: companyProfile?.business_address || "",
      description: companyProfile?.business_description || "",
      services: Array.isArray(companyProfile?.services_offered)
        ? companyProfile?.services_offered || []
        : [],
      skills: normalizedCompanySkills,
      business_hours: companyProfile?.business_hours || "",
    },
    reviewStats: {
      averageRating,
      totalReviews,
    },
  };
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  const job = await fetchJob(id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Job Details */}
          <div className="lg:col-span-2">
            <JobDetails job={job} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <JobApplication job={job} />
            <WriteReviewCard 
              companyName={job.company}
              posterId={job.poster?.id}
            />
            <SimilarJobs currentJobId={job.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
