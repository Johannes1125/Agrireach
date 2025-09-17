import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Eye, MessageSquare, TrendingUp, Plus, Calendar, MapPin } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
}

interface RecruiterDashboardProps {
  user: User
}

export function RecruiterDashboard({ user }: RecruiterDashboardProps) {
  // Mock data - replace with actual data
  const stats = {
    activeJobs: 8,
    totalApplicants: 156,
    hiredWorkers: 23,
    responseRate: 87,
  }

  const activeJobs = [
    {
      id: "1",
      title: "Seasonal Harvest Workers Needed",
      location: "Central Valley, CA",
      applicants: 24,
      posted: "2024-02-15",
      status: "active",
      urgency: "high",
    },
    {
      id: "2",
      title: "Organic Farm Maintenance Team",
      location: "Napa Valley, CA",
      applicants: 12,
      posted: "2024-02-20",
      status: "active",
      urgency: "medium",
    },
  ]

  const recentApplicants = [
    {
      id: "1",
      name: "Maria Rodriguez",
      job: "Seasonal Harvest Workers",
      rating: 4.9,
      experience: "8 years",
      location: "Fresno, CA",
      appliedDate: "2024-02-22",
    },
    {
      id: "2",
      name: "Carlos Martinez",
      job: "Organic Farm Maintenance",
      rating: 4.7,
      experience: "5 years",
      location: "Modesto, CA",
      appliedDate: "2024-02-21",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Manage your job postings and find the right workers.</p>
        </div>
        <Button size="lg" className="w-fit">
          <Plus className="mr-2 h-5 w-5" />
          Post New Job
        </Button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard Statistics">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">Currently posted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired Workers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hiredWorkers}</div>
            <p className="text-xs text-muted-foreground">Successfully hired</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Job Postings */}
        <section className="lg:col-span-2" aria-label="Active Job Postings">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Active Job Postings</CardTitle>
              <CardDescription>Monitor your current job listings and applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeJobs.map((job) => (
                <article key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{job.title}</h4>
                      <Badge variant={job.urgency === "high" ? "destructive" : "secondary"}>
                        {job.urgency} priority
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Posted {job.posted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {job.applicants} applicants
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button size="sm">Manage</Button>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Recent Applicants */}
        <aside aria-label="Recent Applicants">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Recent Applicants</CardTitle>
              <CardDescription>Review new applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentApplicants.map((applicant) => (
                <article key={applicant.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{applicant.name}</h5>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-yellow-500">★</span>
                      <span>{applicant.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{applicant.job}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{applicant.experience} experience</span>
                    <span>{applicant.location}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1">
                      Contact
                    </Button>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
