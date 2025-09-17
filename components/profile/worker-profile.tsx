import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Calendar, Star } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
  rating?: number
  completedJobs?: number
}

interface WorkerProfileProps {
  user: User
}

export function WorkerProfile({ user }: WorkerProfileProps) {
  // Mock data - replace with actual data
  const skills = [
    { name: "Crop Harvesting", level: 95, verified: true },
    { name: "Organic Farming", level: 88, verified: true },
    { name: "Equipment Operation", level: 75, verified: false },
    { name: "Soil Management", level: 82, verified: true },
    { name: "Livestock Care", level: 70, verified: false },
  ]

  const badges = [
    { name: "Harvest Expert", icon: "🌾", earned: "2024-01-15" },
    { name: "Organic Certified", icon: "🌱", earned: "2023-11-20" },
    { name: "Team Leader", icon: "👥", earned: "2023-09-10" },
    { name: "Safety First", icon: "🛡️", earned: "2023-08-05" },
  ]

  const workHistory = [
    {
      id: "1",
      title: "Senior Harvest Coordinator",
      company: "Green Valley Farms",
      location: "Fresno, CA",
      duration: "Mar 2024 - Present",
      rating: 4.9,
      description:
        "Led a team of 15 workers during peak harvest season, ensuring quality standards and safety protocols.",
    },
    {
      id: "2",
      title: "Organic Farm Specialist",
      company: "Sustainable Acres",
      location: "Salinas, CA",
      duration: "Jan 2024 - Feb 2024",
      rating: 4.8,
      description: "Managed organic vegetable cultivation and implemented sustainable farming practices.",
    },
    {
      id: "3",
      title: "Seasonal Farm Worker",
      company: "Valley Fresh Produce",
      location: "Bakersfield, CA",
      duration: "Oct 2023 - Dec 2023",
      rating: 4.7,
      description: "Participated in fruit harvesting and packaging operations during peak season.",
    },
  ]

  const stats = {
    totalEarnings: 45600,
    hoursWorked: 1240,
    projectsCompleted: user.completedJobs || 47,
    repeatClients: 12,
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Skills & Expertise */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Skills & Expertise</CardTitle>
            <CardDescription>Verified skills based on completed work and assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.name}</span>
                    {skill.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{skill.level}%</span>
                </div>
                <Progress value={skill.level} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Work History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Work History</CardTitle>
            <CardDescription>Recent agricultural work experience and client feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {workHistory.map((job) => (
              <div key={job.id} className="border-l-2 border-primary/20 pl-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{job.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {job.duration}
                  </span>
                </div>

                <p className="text-sm leading-relaxed">{job.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Performance Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <span className="font-medium">${stats.totalEarnings.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hours Worked</span>
              <span className="font-medium">{stats.hoursWorked.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projects Completed</span>
              <span className="font-medium">{stats.projectsCompleted}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Repeat Clients</span>
              <span className="font-medium">{stats.repeatClients}</span>
            </div>
          </CardContent>
        </Card>

        {/* Badges & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Badges & Achievements</CardTitle>
            <CardDescription>Recognition for skills and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div key={badge.name} className="text-center p-3 border rounded-lg">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <h5 className="font-medium text-sm">{badge.name}</h5>
                  <p className="text-xs text-muted-foreground">{new Date(badge.earned).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant="secondary">Available</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Next Available</span>
              <span className="text-sm font-medium">Immediately</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Travel Range</span>
              <span className="text-sm font-medium">50 miles</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
