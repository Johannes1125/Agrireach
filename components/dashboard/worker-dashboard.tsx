import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Briefcase, Star, MapPin, Calendar, Award, Clock, DollarSign } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
  joinDate: string
}

interface WorkerDashboardProps {
  user: User
}

export function WorkerDashboard({ user }: WorkerDashboardProps) {
  // Mock data - replace with actual data
  const stats = {
    activeJobs: 3,
    completedJobs: 47,
    earnings: 12450,
    rating: 4.8,
    profileCompletion: 85,
  }

  const recentJobs = [
    {
      id: "1",
      title: "Seasonal Fruit Harvesting",
      company: "Green Valley Farms",
      location: "Fresno, CA",
      pay: "$18/hour",
      status: "active",
      deadline: "2024-03-15",
    },
    {
      id: "2",
      title: "Organic Vegetable Planting",
      company: "Sustainable Acres",
      location: "Salinas, CA",
      pay: "$20/hour",
      status: "pending",
      deadline: "2024-03-20",
    },
  ]

  const skills = [
    { name: "Crop Harvesting", level: 95 },
    { name: "Organic Farming", level: 88 },
    { name: "Equipment Operation", level: 75 },
    { name: "Soil Management", level: 82 },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your work today.</p>
        </div>
        <Button size="lg" className="w-fit">
          <Briefcase className="mr-2 h-5 w-5" />
          Find New Jobs
        </Button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard Statistics">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.earnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating}</div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Jobs */}
        <section className="lg:col-span-2" aria-label="Recent Job Applications">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Recent Job Applications</CardTitle>
              <CardDescription>Track your current and pending job applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentJobs.map((job) => (
                <article key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{job.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {job.deadline}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge>
                      <span className="text-sm font-medium text-primary">{job.pay}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Profile & Skills */}
        <aside className="space-y-6" aria-label="Profile Information">
          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Profile Completion</CardTitle>
              <CardDescription>Complete your profile to get more job matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Profile Progress</span>
                  <span>{stats.profileCompletion}%</span>
                </div>
                <Progress value={stats.profileCompletion} className="h-2" />
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                Complete Profile
              </Button>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Your Skills</CardTitle>
              <CardDescription>Skill levels based on completed work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{skill.name}</span>
                    <span>{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
              <Button variant="outline" className="w-full bg-transparent">
                <Award className="mr-2 h-4 w-4" />
                View All Badges
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
