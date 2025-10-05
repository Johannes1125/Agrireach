"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Clock, Star, Bookmark, ExternalLink, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function OpportunityBoard() {
  const [sortBy, setSortBy] = useState("newest")
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/opportunities?limit=20&page=1`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return
      const items: any[] = (json?.data?.items || []).map((j: any) => ({
        id: String(j._id),
        title: j.title,
        company: j.company_name || "",
        location: j.location,
        type: j.duration || j.pay_type,
        payRange: `₱${j.pay_rate}/${j.pay_type}`,
        urgency: j.urgency,
        postedDate: j.created_at,
        deadline: j.start_date || j.created_at,
        applicants: j.applications_count || 0,
        description: j.description,
        skills: Array.isArray(j.required_skills) ? j.required_skills : [],
        companyLogo: "/placeholder.svg",
        companyRating: 0,
        matchScore: 0,
      }))
      setJobs(items)
      setTotal(json?.data?.total || items.length)
    }
    load()
  }, [])

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <section className="space-y-6" aria-label="Job Opportunities">
      {/* Sort and View Options */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">{total} Job Opportunities</h2>
          <p className="text-sm text-muted-foreground">Showing jobs matching your profile and preferences</p>
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
                      <AvatarImage src={job.companyLogo || "/placeholder.svg"} alt={job.company} />
                      <AvatarFallback>
                        {job.company
                          ? job.company.split(" ").map((n) => n[0]).join("")
                          : "C"}
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
                          <span className="font-medium text-muted-foreground">{job.company}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">{job.companyRating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSaveJob(job.id)}
                          className={savedJobs.includes(job.id) ? "text-primary" : ""}
                        >
                          <Bookmark className={`h-4 w-4 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>

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
                      <Badge variant={getUrgencyColor(job.urgency)} className="text-xs">
                        {job.urgency} priority
                      </Badge>

                      <span className="font-medium text-primary">{job.payRange}</span>

                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                      <Link href={`/opportunities/${job.id}`} className="flex-1">
                        <Button className="w-full">Apply Now</Button>
                      </Link>

                      <Link href={`/opportunities/${job.id}`}>
                        <Button variant="outline" className="w-full sm:w-auto bg-transparent">
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
  )
}
