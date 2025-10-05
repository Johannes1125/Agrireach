import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, DollarSign, Users, Star, Building } from "lucide-react"
import Link from "next/link"

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  payRange: string
  description: string
  companyLogo?: string
  images?: string[]
  requirements: string[]
  benefits: string[]
  postedDate: string
  deadline: string
  urgency: string
  skills: string[]
  poster?: { id: string; name: string; location?: string }
  companyInfo: {
    name: string
    size: string
    industry: string
    rating: number
    description: string
  }
}

interface JobDetailsProps {
  job: Job
}

export function JobDetails({ job }: JobDetailsProps) {
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
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={job.companyLogo || "/placeholder.svg?key=company-logo"} alt={job.company} />
              <AvatarFallback>
                {job.company
                  ? job.company.split(" ").map((n) => n[0]).join("")
                  : "C"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="font-heading text-3xl font-bold mb-2">{job.title}</h1>

              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium text-lg">{job.company}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">{job.companyInfo.rating}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>

                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{job.payRange}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getUrgencyColor(job.urgency)}>{job.urgency} priority</Badge>

                {job.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* Posted by */}
      {job.poster && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Posted by</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={job.companyLogo || "/placeholder.svg"} />
              <AvatarFallback>{job.poster.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{job.poster.name}</div>
              {job.poster.location && (
                <div className="text-sm text-muted-foreground">{job.poster.location}</div>
              )}
            </div>
            <Link href={`/profile?user=${job.poster.id}`} className="text-sm text-primary">View profile</Link>
          </CardContent>
        </Card>
      )}

      {/* Gallery */}
      {Array.isArray(job.images) && job.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Job Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {job.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Job image ${idx + 1}`} className="w-full h-40 object-cover rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{job.description}</p>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {job.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">{requirement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Benefits & Perks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {job.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">About {job.companyInfo.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{job.companyInfo.description}</p>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Industry: {job.companyInfo.industry}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Size: {job.companyInfo.size}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Important Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Posted Date</span>
            <span className="font-medium">{formatDate(job.postedDate)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Application Deadline</span>
            <span className="font-medium">{formatDate(job.deadline)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
