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
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function OpportunityBoard() {
  const [sortBy, setSortBy] = useState("newest");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  // Mock job data - replace with actual data fetching
  const jobs = [
    {
      id: "1",
      title: "Seasonal Harvest Coordinator",
      company: "Green Valley Farms",
      location: "Fresno, CA",
      type: "Seasonal",
      payRange: "$18-22/hour",
      urgency: "high",
      postedDate: "2024-02-15",
      deadline: "2024-03-15",
      applicants: 24,
      description:
        "Lead harvest operations during peak season. Manage team of 15+ workers and ensure quality standards.",
      skills: ["Team Leadership", "Crop Harvesting", "Quality Control"],
      companyLogo: "/placeholder.svg?key=company1",
      companyRating: 4.7,
      matchScore: 95,
    },
    {
      id: "2",
      title: "Organic Farm Specialist",
      company: "Sustainable Acres",
      location: "Salinas, CA",
      type: "Full-time",
      payRange: "$20-25/hour",
      urgency: "medium",
      postedDate: "2024-02-20",
      deadline: "2024-03-20",
      applicants: 12,
      description:
        "Manage organic vegetable cultivation and implement sustainable farming practices.",
      skills: ["Organic Farming", "Soil Management", "Pest Control"],
      companyLogo: "/placeholder.svg?key=company2",
      companyRating: 4.9,
      matchScore: 88,
    },
    {
      id: "3",
      title: "Equipment Operator - Tractors",
      company: "Valley Equipment Co.",
      location: "Bakersfield, CA",
      type: "Contract",
      payRange: "$22-28/hour",
      urgency: "urgent",
      postedDate: "2024-02-18",
      deadline: "2024-03-10",
      applicants: 8,
      description:
        "Operate and maintain agricultural equipment including tractors, harvesters, and irrigation systems.",
      skills: ["Equipment Operation", "Mechanical Skills", "Safety Protocols"],
      companyLogo: "/placeholder.svg?key=company3",
      companyRating: 4.5,
      matchScore: 82,
    },
    {
      id: "4",
      title: "Livestock Care Assistant",
      company: "Ranch Heritage Farm",
      location: "Modesto, CA",
      type: "Part-time",
      payRange: "$16-20/hour",
      urgency: "standard",
      postedDate: "2024-02-22",
      deadline: "2024-04-01",
      applicants: 15,
      description:
        "Assist with daily care of cattle and sheep. Feed animals, maintain facilities, and monitor health.",
      skills: ["Animal Care", "Physical Fitness", "Attention to Detail"],
      companyLogo: "/placeholder.svg?key=company4",
      companyRating: 4.6,
      matchScore: 75,
    },
    {
      id: "5",
      title: "Greenhouse Manager",
      company: "Coastal Growing Systems",
      location: "Ventura, CA",
      type: "Full-time",
      payRange: "$25-32/hour",
      urgency: "medium",
      postedDate: "2024-02-19",
      deadline: "2024-03-25",
      applicants: 18,
      description:
        "Oversee greenhouse operations, manage growing schedules, and supervise staff.",
      skills: ["Greenhouse Management", "Plant Science", "Team Leadership"],
      companyLogo: "/placeholder.svg?key=company5",
      companyRating: 4.8,
      matchScore: 91,
    },
  ];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="space-y-6" aria-label="Job Opportunities">
      {/* Sort and View Options */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            247 Job Opportunities
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing jobs matching your profile and preferences
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
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
      <section className="space-y-4" aria-label="Job Listings">
        {jobs.map((job) => (
          <article key={job.id} className="hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  {/* Company Logo and Match Score */}
                  <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-2">
                    <Avatar className="h-12 w-12 lg:h-16 lg:w-16">
                      <AvatarImage
                        src={job.companyLogo || "/placeholder.svg"}
                        alt={job.company}
                      />
                      <AvatarFallback>
                        {job.company
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    {job.matchScore >= 80 && (
                      <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {job.matchScore}% Match
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
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
                        <span>Posted {formatDate(job.postedDate)}</span>
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
                        {job.skills.slice(0, 3).map((skill) => (
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
                      <Link href={`/opportunities/${job.id}`}>
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
        ))}
      </section>

      {/* Load More */}
      <footer className="text-center pt-6">
        <Button variant="outline" size="lg">
          Load More Jobs
        </Button>
      </footer>
    </section>
  );
}
