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

export function OpportunityBoard() {
  const [sortBy, setSortBy] = useState("newest");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { searchQuery, location } = useJobSearch();

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
          const base = hasMax ? `₱${j.pay_rate}–₱${j.pay_rate_max}` : `₱${j.pay_rate}`
          return j.pay_type ? `${base}/${j.pay_type}` : base
        })(),
        urgency: j.urgency,
        postedDate: j.created_at,
        deadline: j.start_date || j.created_at,
        applicants: j.applications_count || 0,
        description: j.description,
        skills: Array.isArray(j.required_skills) ? j.required_skills : [],
        companyLogo: j.company_logo || "/placeholder.svg",
        companyRating: 0,
        matchScore: j.matchScore || 0,
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
            job.skills.some((skill: string) =>
              skill.toLowerCase().includes(query)
            ))
      );
    }

    if (location) {
      const loc = location.toLowerCase();
      filtered = filtered.filter(
        (job) => job.location && job.location.toLowerCase().includes(loc)
      );
    }

    // Apply sorting
    if (sortBy === "match") {
      filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === "pay-high") {
      filtered.sort((a, b) => {
        const aPay = parseInt(a.payRange.replace(/[^\d]/g, "")) || 0;
        const bPay = parseInt(b.payRange.replace(/[^\d]/g, "")) || 0;
        return bPay - aPay;
      });
    } else if (sortBy === "pay-low") {
      filtered.sort((a, b) => {
        const aPay = parseInt(a.payRange.replace(/[^\d]/g, "")) || 0;
        const bPay = parseInt(b.payRange.replace(/[^\d]/g, "")) || 0;
        return aPay - bPay;
      });
    } else if (sortBy === "deadline") {
      filtered.sort((a, b) => {
        const aDate = new Date(a.deadline).getTime();
        const bDate = new Date(b.deadline).getTime();
        return aDate - bDate;
      });
    } else {
      // newest first (default)
      filtered.sort((a, b) => {
        const aDate = new Date(a.postedDate).getTime();
        const bDate = new Date(b.postedDate).getTime();
        return bDate - aDate;
      });
    }

    setJobs(filtered);
    setTotal(filtered.length);
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
              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start">
                    {/* Company Logo and Match Score */}
                    <div className="flex items-start gap-3 sm:gap-4 lg:flex-col lg:items-center lg:gap-2">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16">
                        <AvatarImage
                          src={job.companyLogo || "/placeholder.svg"}
                          alt={job.company}
                        />
                        <AvatarFallback>
                          {job.company
                            ? job.company
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : "C"}
                        </AvatarFallback>
                      </Avatar>

                      {job.matchScore > 0 && (
                        <div className="text-center">
                          <Badge 
                            variant={job.matchScore >= 80 ? "secondary" : "outline"} 
                            className="text-xs"
                          >
                            {job.matchScore}% Match
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <Link href={`/opportunities/${job.id}`}>
                            <h3 className="font-heading text-lg font-semibold hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-medium text-muted-foreground">
                              {job.company}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-muted-foreground">
                                {job.companyRating}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSaveJob(job.id)}
                            className={
                              savedJobs.includes(job.id) ? "text-primary" : ""
                            }
                          >
                            <Bookmark
                              className={`h-4 w-4 ${
                                savedJobs.includes(job.id) ? "fill-current" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {job.description}
                      </p>

                      {/* Job Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{job.type}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Posted {formatRelativeTime(job.postedDate)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{job.applicants} applicants</span>
                        </div>
                      </div>

                      {/* Skills and Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getUrgencyColor(job.urgency)}
                          className="text-xs"
                        >
                          {job.urgency} priority
                        </Badge>

                        <span className="font-medium text-primary">
                          {job.payRange}
                        </span>

                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 3).map((skill: string) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <Link
                          href={`/opportunities/${job.id}`}
                          className="flex-1"
                        >
                          <Button className="w-full">Apply Now</Button>
                        </Link>

                        <Link href={`/opportunities/${job.id}`}>
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto bg-transparent"
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
