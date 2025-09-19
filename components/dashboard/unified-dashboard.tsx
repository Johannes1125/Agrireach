"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/components/notifications/notification-provider"
import {
  Briefcase,
  Star,
  MapPin,
  Calendar,
  Award,
  Clock,
  DollarSign,
  Users,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  ShoppingCart,
  Package,
  Truck,
  Bell,
} from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
  joinDate: string
}

interface UnifiedDashboardProps {
  user: User
}

export function UnifiedDashboard({ user }: UnifiedDashboardProps) {
  const [activeRole, setActiveRole] = useState(user.role)
  const notifications = useNotifications()

  const workerData = {
    stats: {
      activeJobs: 3,
      completedJobs: 47,
      earnings: 12450,
      rating: 4.8,
      profileCompletion: 85,
    },
    recentJobs: [
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
    ],
    skills: [
      { name: "Crop Harvesting", level: 95 },
      { name: "Organic Farming", level: 88 },
      { name: "Equipment Operation", level: 75 },
      { name: "Soil Management", level: 82 },
    ],
  }

  const recruiterData = {
    stats: {
      activeJobs: 8,
      totalApplicants: 156,
      hiredWorkers: 23,
      responseRate: 87,
    },
    activeJobs: [
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
    ],
    recentApplicants: [
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
    ],
  }

  const buyerData = {
    stats: {
      activeOrders: 12,
      totalPurchases: 89,
      monthlySpend: 8450,
      savedSuppliers: 15,
    },
    recentOrders: [
      {
        id: "1",
        product: "Organic Tomatoes",
        supplier: "Green Valley Farms",
        quantity: "500 lbs",
        price: "$1,250",
        status: "in-transit",
        deliveryDate: "2024-02-28",
      },
      {
        id: "2",
        product: "Fresh Strawberries",
        supplier: "Berry Best Farm",
        quantity: "200 lbs",
        price: "$800",
        status: "processing",
        deliveryDate: "2024-03-02",
      },
    ],
    featuredProducts: [
      {
        id: "1",
        name: "Organic Avocados",
        supplier: "Coastal Groves",
        price: "$3.50/lb",
        rating: 4.9,
        location: "Ventura, CA",
        image: "/organic-avocados.png",
      },
      {
        id: "2",
        name: "Artisan Honey",
        supplier: "Mountain Bee Co.",
        price: "$12/jar",
        rating: 4.8,
        location: "Sonoma, CA",
        image: "/artisan-honey-jar.jpg",
      },
    ],
  }

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "worker":
        return {
          title: "Worker Dashboard",
          subtitle: "Find jobs and track your agricultural work",
          primaryAction: "Find New Jobs",
          primaryIcon: Briefcase,
        }
      case "recruiter":
        return {
          title: "Recruiter Dashboard",
          subtitle: "Post jobs and manage your hiring process",
          primaryAction: "Post New Job",
          primaryIcon: Plus,
        }
      case "buyer":
        return {
          title: "Buyer Dashboard",
          subtitle: "Discover and purchase from local farmers",
          primaryAction: "Browse Marketplace",
          primaryIcon: ShoppingCart,
        }
      default:
        return {
          title: "Dashboard",
          subtitle: "Welcome to AgriReach",
          primaryAction: "Get Started",
          primaryIcon: Plus,
        }
    }
  }

  const config = getRoleConfig(activeRole)
  const PrimaryIcon = config.primaryIcon

  const handleQuickAction = (action: string, role: string) => {
    switch (action) {
      case "find-jobs":
        notifications.showSuccess("Redirecting to Jobs", "Finding new opportunities for you...")
        break
      case "post-job":
        notifications.showSuccess("Opening Job Form", "Create a new job posting...")
        break
      case "browse-marketplace":
        notifications.showSuccess("Opening Marketplace", "Discover fresh products from local farmers...")
        break
      case "complete-profile":
        notifications.showInfo("Profile Completion", "Complete your profile to get better matches")
        break
      case "view-applicants":
        notifications.showInfo("Viewing Applicants", "Loading recent job applications...")
        break
      case "track-order":
        notifications.showInfo("Order Tracking", "Checking delivery status...")
        break
      default:
        notifications.showInfo("Action", `Performing ${action}...`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Role Switcher */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
            <p className="text-muted-foreground">{config.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="lg">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button
              size="lg"
              className="w-fit"
              onClick={() => handleQuickAction(config.primaryAction.toLowerCase().replace(" ", "-"), activeRole)}
            >
              <PrimaryIcon className="mr-2 h-5 w-5" />
              {config.primaryAction}
            </Button>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit">
            <TabsTrigger value="worker" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Worker
            </TabsTrigger>
            <TabsTrigger value="recruiter" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recruiter
            </TabsTrigger>
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Buyer
            </TabsTrigger>
          </TabsList>

          {/* Worker Dashboard */}
          <TabsContent value="worker" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workerData.stats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">Currently working</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workerData.stats.completedJobs}</div>
                  <p className="text-xs text-muted-foreground">Total completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${workerData.stats.earnings.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This year</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workerData.stats.rating}</div>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Jobs */}
              <section className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Job Applications</CardTitle>
                    <CardDescription>Track your current and pending job applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workerData.recentJobs.map((job) => (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => notifications.showInfo("Job Details", `Loading details for ${job.title}...`)}
                        >
                          View Details
                        </Button>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Profile & Skills */}
              <aside className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Profile Completion</CardTitle>
                    <CardDescription>Complete your profile to get more job matches</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profile Progress</span>
                        <span>{workerData.stats.profileCompletion}%</span>
                      </div>
                      <Progress value={workerData.stats.profileCompletion} className="h-2" />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => handleQuickAction("complete-profile", activeRole)}
                    >
                      Complete Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Your Skills</CardTitle>
                    <CardDescription>Skill levels based on completed work</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workerData.skills.map((skill) => (
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
          </TabsContent>

          {/* Recruiter Dashboard */}
          <TabsContent value="recruiter" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterData.stats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">Currently posted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterData.stats.totalApplicants}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hired Workers</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterData.stats.hiredWorkers}</div>
                  <p className="text-xs text-muted-foreground">Successfully hired</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterData.stats.responseRate}%</div>
                  <p className="text-xs text-muted-foreground">Average response</p>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Active Job Postings */}
              <section className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Active Job Postings</CardTitle>
                    <CardDescription>Monitor your current job listings and applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recruiterData.activeJobs.map((job) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => notifications.showInfo("View Job", `Loading details for ${job.title}...`)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => notifications.showInfo("Manage Job", `Managing ${job.title}...`)}
                          >
                            Manage
                          </Button>
                        </div>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Recent Applicants */}
              <aside>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Applicants</CardTitle>
                    <CardDescription>Review new applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recruiterData.recentApplicants.map((applicant) => (
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() =>
                              notifications.showInfo("Applicant Profile", `Loading profile for ${applicant.name}...`)
                            }
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              notifications.showInfo("Contact Applicant", `Contacting ${applicant.name}...`)
                            }
                          >
                            Contact
                          </Button>
                        </div>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>

          {/* Buyer Dashboard */}
          <TabsContent value="buyer" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buyerData.stats.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">Currently processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buyerData.stats.totalPurchases}</div>
                  <p className="text-xs text-muted-foreground">All time orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${buyerData.stats.monthlySpend.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saved Suppliers</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buyerData.stats.savedSuppliers}</div>
                  <p className="text-xs text-muted-foreground">Favorite suppliers</p>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Orders */}
              <section className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Orders</CardTitle>
                    <CardDescription>Track your current and recent purchases</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {buyerData.recentOrders.map((order) => (
                      <article key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{order.product}</h4>
                          <p className="text-sm text-muted-foreground">from {order.supplier}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {order.quantity}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              Delivery {order.deliveryDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={order.status === "in-transit" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                            <span className="text-sm font-medium text-primary">{order.price}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction("track-order", activeRole)}
                        >
                          Track Order
                        </Button>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Featured Products */}
              <aside>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Featured Products</CardTitle>
                    <CardDescription>Fresh picks from local suppliers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {buyerData.featuredProducts.map((product) => (
                      <article key={product.id} className="p-3 border rounded-lg space-y-3">
                        <div className="flex gap-3">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 space-y-1">
                            <h5 className="font-medium">{product.name}</h5>
                            <p className="text-sm text-muted-foreground">{product.supplier}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{product.rating}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{product.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary">{product.price}</span>
                          <Button
                            size="sm"
                            onClick={() => notifications.showInfo("Add to Cart", `Adding ${product.name} to cart...`)}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>
        </Tabs>
      </header>
    </div>
  )
}
