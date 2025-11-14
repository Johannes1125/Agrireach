"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  Bookmark,
  ExternalLink,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OpportunityFilters } from "./opportunity-filters";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useJobSearch } from "@/contexts/job-search-context";
import { InlineLoader } from "@/components/ui/page-loader";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { normalizeSkillRequirements, SKILL_LEVELS, SkillLevel } from "@/lib/skills";
import { useAuth } from "@/hooks/use-auth";

export function OpportunityBoard() {
  const [sortBy, setSortBy] = useState("newest");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { searchQuery, location } = useJobSearch();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Build API URL with sortBy parameter if needed
      const apiUrl = `/api/opportunities?limit=100&page=1${sortBy === "match" ? "&sortBy=match" : ""}`;
      // Add minimum delay for loading state
      const [data] = await Promise.all([
        fetch(apiUrl).then(res => res.json().catch(() => ({}))),
        new Promise(resolve => setTimeout(resolve, 2000)) // Minimum 2 second delay
      ]);
      
      const items: any[] = (data?.data?.items || []).map((j: any) => ({
        id: String(j._id),
        title: j.title,
        company: j.company_name || "",
        location: j.location,
        type: j.duration || j.pay_type || "",
        payRange: ((): string => {
          const hasMin = typeof j.pay_rate === "number" && j.pay_rate > 0
          const hasMax = typeof j.pay_rate_max === "number" && j.pay_rate_max > j.pay_rate
          if (!hasMin) return ""
          const payType = j.pay_type || "hourly"
          const base = hasMax ? `P${j.pay_rate}–P${j.pay_rate_max}` : `P${j.pay_rate}`
          return `${base}/${payType}`
        })(),
        urgency: j.urgency,
        postedDate: j.created_at,
        deadline: j.start_date || j.created_at,
        applicants: j.applications_count || 0,
        description: j.description,
        skills: normalizeSkillRequirements(j.required_skills as any),
        companyLogo: j.company_logo || "/placeholder.svg",
        companyRating: 0,
        matchScore: j.matchScore || 0,
        recruiterId: j.recruiter_id?._id ? String(j.recruiter_id._id) : String(j.recruiter_id || ""),
      }));
      setAllJobs(items);
      setLoading(false);
    };
    load();
  }, [sortBy]);

  // Filter and sort jobs based on search query, location, and sortBy
  useEffect(() => {
    let filtered = allJobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          (job.skills &&
            job.skills.some((skill: any) =>
              (skill?.name || "").toLowerCase().includes(query)
            ))
      );
    }

    if (location) {
      const loc = location.toLowerCase();
      filtered = filtered.filter(
        (job) => job.location && job.location.toLowerCase().includes(loc)
      );
    }

    // Apply sorting - always prioritize matching jobs first
    const matchThreshold = 0; // Jobs with any match (score > 0) are prioritized
    
    // Separate matching and non-matching jobs
    const matchingJobs = filtered.filter((job) => (job.matchScore || 0) > matchThreshold);
    const nonMatchingJobs = filtered.filter((job) => (job.matchScore || 0) <= matchThreshold);
    
    // Sort each group
    const sortFunction = (a: any, b: any) => {
      if (sortBy === "match") {
        return (b.matchScore || 0) - (a.matchScore || 0);
      } else if (sortBy === "pay-high") {
        const aPay = parseInt(a.payRange.replace(/[^\d]/g, "")) || 0;
        const bPay = parseInt(b.payRange.replace(/[^\d]/g, "")) || 0;
        return bPay - aPay;
      } else if (sortBy === "pay-low") {
        const aPay = parseInt(a.payRange.replace(/[^\d]/g, "")) || 0;
        const bPay = parseInt(b.payRange.replace(/[^\d]/g, "")) || 0;
        return aPay - bPay;
      } else if (sortBy === "deadline") {
        const aDate = new Date(a.deadline).getTime();
        const bDate = new Date(b.deadline).getTime();
        return aDate - bDate;
      } else {
        // newest first (default)
        const aDate = new Date(a.postedDate).getTime();
        const bDate = new Date(b.postedDate).getTime();
        return bDate - aDate;
      }
    };
    
    matchingJobs.sort(sortFunction);
    nonMatchingJobs.sort(sortFunction);
    
    // Combine: matching jobs first, then non-matching
    const sortedJobs = [...matchingJobs, ...nonMatchingJobs];

    setJobs(sortedJobs);
    setTotal(sortedJobs.length);
  }, [searchQuery, location, allJobs, sortBy]);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <InlineLoader text="Loading opportunities..." variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-6" aria-label="Job Opportunities">
      {/* Sort and View Options */}
      <header className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-semibold">
            {total} Job Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing jobs matching your profile and preferences
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 overflow-y-auto">
              <div className="py-4">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <OpportunityFilters />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="pay-high">Highest Pay</SelectItem>
              <SelectItem value="pay-low">Lowest Pay</SelectItem>
              <SelectItem value="deadline">Deadline Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Job Listings */}
      <section aria-label="Job Listings">
        <div className="space-y-3 sm:space-y-4 max-h-[900px] overflow-y-auto pr-1 sm:pr-2">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
            <h3 className="mt-4 text-lg font-medium">No matching jobs found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or location filters to find more
              opportunities
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <article key={job.id} className="hover:shadow-md transition-shadow">
              <Card className="relative">
                <CardContent className="p-4 md:p-6">
                  <div className="flex gap-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-12 w-12 md:h-16 md:w-16">
                        <AvatarImage
                          src={job.companyLogo || "/placeholder.svg"}
                          alt={job.company}
                        />
                        <AvatarFallback className="bg-black text-white">
                          {job.company
                            ? job.company
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : "C"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Header with Title, Company, Rating, and Bookmark */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link href={`/opportunities/${job.id}`}>
                            <h3 className="font-heading text-lg md:text-xl font-semibold hover:text-primary transition-colors mb-1">
                              {job.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">
                              {job.company || "Not specified"}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-muted-foreground">
                                {job.companyRating || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bookmark Icon - Top Right */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSaveJob(job.id)}
                          className="flex-shrink-0 h-8 w-8 p-0"
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              savedJobs.includes(job.id) ? "fill-current text-primary" : ""
                            }`}
                          />
                        </Button>
                      </div>

                      {/* Job Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {job.description || "No description available."}
                      </p>

                      {/* Job Meta Information */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location || "Not specified"}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{job.type || "Not specified"}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Posted {formatRelativeTime(job.postedDate)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{job.applicants || 0} applicants</span>
                        </div>
                      </div>

                      {/* Tags: Priority, Pay Rate, Skills */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getUrgencyColor(job.urgency || "low")}
                          className="text-xs"
                        >
                          {job.urgency || "low"} priority
                        </Badge>

                        {job.payRange && (
                          <Badge variant="outline" className="text-xs font-medium text-primary">
                            {job.payRange}
                          </Badge>
                        )}

                        {job.skills && job.skills.slice(0, 3).map((skill: any) => (
                          <Badge
                            key={skill.name}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill.name}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        {user && job.recruiterId && String(job.recruiterId) === String(user.id) ? (
                          <Button className="w-full sm:flex-1" variant="outline" disabled>
                            Your Job Posting
                          </Button>
                        ) : (
                          <Link
                            href={`/opportunities/${job.id}`}
                            className="flex-1"
                          >
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                              Apply Now
                            </Button>
                          </Link>
                        )}

                        <Link href={`/opportunities/${job.id}`} className="sm:w-auto">
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))
        )}
        </div>
  </section>
</section>
  );
}
