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
  Flag,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OpportunityFilters } from "./opportunity-filters";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useJobSearch } from "@/contexts/job-search-context";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { normalizeSkillRequirements, SKILL_LEVELS, SkillLevel } from "@/lib/skills";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/auth-client";
import { toast } from "sonner";

export function OpportunityBoard() {
  const [sortBy, setSortBy] = useState("newest");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportingJobId, setReportingJobId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { searchQuery, location } = useJobSearch();
  const { user } = useAuth();

  // Load jobs only once on mount
  useEffect(() => {
    if (hasLoaded) return; // Only load once
    
    const load = async () => {
      setLoading(true);
      try {
        // Build API URL - get all jobs for client-side filtering/sorting
        const apiUrl = `/api/opportunities?limit=100&page=1`;
        const response = await fetch(apiUrl);
        const data = await response.json().catch(() => ({}));
        
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
        setHasLoaded(true);
      } catch (error) {
        console.error("Failed to load opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasLoaded]);

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

  const handleReportClick = (jobId: string) => {
    setReportingJobId(jobId);
    setReportOpen(true);
    setReportReason("");
    setReportDescription("");
  };

  const handleSubmitReport = async () => {
    if (!reportingJobId || !reportReason || !reportDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) {
      toast.error("Please log in to report a job");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await authFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "job",
          content_id: reportingJobId,
          reason: reportReason,
          description: reportDescription.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit report");
      }

      toast.success("Report submitted successfully. Thank you for helping keep our community safe.");
      setReportOpen(false);
      setReportReason("");
      setReportDescription("");
      setReportingJobId(null);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
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

  return (
    <div className="flex gap-4 lg:gap-6">
      {/* Desktop Filter Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4">
          <OpportunityFilters />
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 space-y-4 sm:space-y-6" aria-label="Job Opportunities">
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
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

                        {/* Bookmark and Report Icons - Top Right */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSaveJob(job.id)}
                            className="flex-shrink-0 h-8 w-8 p-0"
                            aria-label="Save job"
                          >
                            <Bookmark
                              className={`h-4 w-4 ${
                                savedJobs.includes(job.id) ? "fill-current text-primary" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportClick(job.id)}
                            className="flex-shrink-0 h-8 w-8 p-0"
                            aria-label="Report job"
                          >
                            <Flag className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
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

    {/* Report Dialog */}
    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Job Posting</DialogTitle>
          <DialogDescription>
            Help us maintain a safe community by reporting inappropriate or suspicious job postings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason for Reporting</Label>
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam or Scam</SelectItem>
                <SelectItem value="misleading">Misleading Information</SelectItem>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="fake">Fake Job Posting</SelectItem>
                <SelectItem value="discrimination">Discrimination</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">Additional Details</Label>
            <Textarea
              id="report-description"
              placeholder="Please provide more details about why you're reporting this job posting..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReportOpen(false);
              setReportReason("");
              setReportDescription("");
              setReportingJobId(null);
            }}
            disabled={isSubmittingReport}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReport}
            disabled={!reportReason || !reportDescription.trim() || isSubmittingReport}
            variant="destructive"
          >
            {isSubmittingReport ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}
