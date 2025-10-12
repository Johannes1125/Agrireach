"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useJobSearch } from "@/contexts/job-search-context";
import { useEffect, useState } from "react";

interface JobStats {
  activeJobs: number;
  newJobsThisWeek: number;
  companiesHiring: number;
}

export function OpportunityHeader() {
  const { searchQuery, setSearchQuery, location, setLocation } = useJobSearch();
  const [stats, setStats] = useState<JobStats>({
    activeJobs: 0,
    newJobsThisWeek: 0,
    companiesHiring: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/opportunities/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch job statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-card border-b">
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">
                Job Opportunities
              </h1>
              <p className="text-muted-foreground">
                Discover agricultural jobs and seasonal work opportunities
              </p>
            </div>

            <Link href="/opportunities/post">
              <Button size="lg" className="w-full md:w-auto">
                <Plus className="mr-2 h-5 w-5" />
                Post a Job
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs, skills, or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base py-3"
              />
            </div>

            <div className="relative md:w-64">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 text-base py-3"
              />
            </div>

            <Button size="lg" className="md:w-auto">
              Search Jobs
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {loading ? "..." : `${stats.activeJobs} Active Jobs`}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {loading ? "..." : `${stats.newJobsThisWeek} New This Week`}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {loading ? "..." : `${stats.companiesHiring} Companies Hiring`}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
