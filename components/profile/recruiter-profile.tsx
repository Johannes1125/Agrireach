import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Calendar, Star, Users, Globe, Phone, Mail } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
}

interface RecruiterProfileProps {
  user: User
}

export function RecruiterProfile({ user }: RecruiterProfileProps) {
  // Mock data - replace with actual data
  const companyInfo = {
    name: "Green Valley Agricultural Services",
    industry: "Sustainable Agriculture",
    size: "50-200 employees",
    founded: "2015",
    website: "www.greenvalleyag.com",
    description:
      "Leading provider of sustainable agricultural services in Central California, specializing in organic farming practices and seasonal workforce management.",
  }

  const jobPostings = [
    {
      id: "1",
      title: "Seasonal Harvest Coordinator",
      location: "Fresno, CA",
      type: "Seasonal",
      applicants: 24,
      posted: "2024-02-15",
      status: "active",
    },
    {
      id: "2",
      title: "Organic Farm Supervisor",
      location: "Salinas, CA",
      type: "Full-time",
      applicants: 12,
      posted: "2024-02-10",
      status: "active",
    },
    {
      id: "3",
      title: "Equipment Operator",
      location: "Bakersfield, CA",
      type: "Contract",
      applicants: 8,
      posted: "2024-02-05",
      status: "closed",
    },
  ]

  const stats = {
    totalHires: 156,
    activeJobs: 8,
    averageRating: 4.7,
    responseTime: "2 hours",
  }

  const reviews = [
    {
      id: "1",
      worker: "Maria Rodriguez",
      rating: 5,
      comment:
        "Excellent communication and fair compensation. Green Valley treats workers with respect and provides clear job expectations.",
      date: "2024-02-20",
    },
    {
      id: "2",
      worker: "Carlos Martinez",
      rating: 4,
      comment: "Good working conditions and timely payments. Would recommend to other agricultural workers.",
      date: "2024-02-15",
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Company Information</CardTitle>
            <CardDescription>About {companyInfo.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Industry: {companyInfo.industry}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Size: {companyInfo.size}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Founded: {companyInfo.founded}</span>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={`https://${companyInfo.website}`} className="text-sm text-primary hover:underline">
                  {companyInfo.website}
                </a>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{companyInfo.description}</p>
          </CardContent>
        </Card>

        {/* Active Job Postings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Current Job Postings</CardTitle>
            <CardDescription>Open positions and hiring status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobPostings.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{job.title}</h4>
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                    <span>{job.type}</span>
                    <span>{job.applicants} applicants</span>
                  </div>

                  <p className="text-xs text-muted-foreground">Posted {job.posted}</p>
                </div>

                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Worker Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Worker Reviews</CardTitle>
            <CardDescription>Feedback from hired workers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-l-2 border-primary/20 pl-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{review.worker}</h5>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Hiring Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Hiring Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Hires</span>
              <span className="font-medium">{stats.totalHires}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Jobs</span>
              <span className="font-medium">{stats.activeJobs}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{stats.averageRating}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response Time</span>
              <span className="font-medium">{stats.responseTime}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">hiring@greenvalleyag.com</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">(559) 555-0123</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Business License</span>
              <Badge variant="secondary">Verified</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Insurance</span>
              <Badge variant="secondary">Verified</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Background Check</span>
              <Badge variant="secondary">Verified</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
