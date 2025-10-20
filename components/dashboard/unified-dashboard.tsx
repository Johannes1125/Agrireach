"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/components/notifications/notification-provider"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useRecruiterData } from "@/hooks/use-recruiter-data"
import { useBuyerData } from "@/hooks/use-buyer-data"
import { useOrdersData } from "@/hooks/use-orders-data"
import { useFeaturedProductsData } from "@/hooks/use-featured-products-data"
import { ManageJobModal } from "@/components/dashboard/manage-job-modal"
import { ManageProductModal } from "@/components/marketplace/manage-product-modal"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/auth-client"
import {
  Briefcase,
  Star,
  MapPin,
  Calendar,
  Award,
  Clock,
  Users,
  Eye,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Plus,
  ShoppingCart,
  Package,
  Truck,
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
  const [activeRole, setActiveRole] = useState(user.role || "worker")
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [manageProductModalOpen, setManageProductModalOpen] = useState(false)
  const router = useRouter()
  const notifications = useNotifications()
  const { stats, activities, loading, error } = useDashboardData()
  const { jobs: recruiterJobs, applicants: recentApplicants, loading: recruiterLoading } = useRecruiterData()
  const { products: buyerProducts, loading: buyerLoading, refetch: refetchProducts } = useBuyerData()
  const { orders: buyerOrders, loading: buyerOrdersLoading } = useOrdersData("buyer", 5)
  const { orders: sellerOrders, loading: sellerOrdersLoading } = useOrdersData("seller", 5)
  const { products: featuredProducts, loading: featuredProductsLoading } = useFeaturedProductsData(12)
  
  // Debug featured products data
  useEffect(() => {
    console.log("Featured products in dashboard:", featuredProducts)
    console.log("Featured products loading:", featuredProductsLoading)
  }, [featuredProducts, featuredProductsLoading])

  const getWorkerData = () => {
    if (!stats?.worker) return null

    return {
      stats: {
        activeJobs: stats.worker.acceptedJobs,
        pendingApplications: stats.worker.pendingApplications,
        totalApplications: stats.worker.activeApplications,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('job') || a.type.includes('application')).slice(0, 5),
    }
  }

  const getRecruiterData = () => {
    if (!stats?.recruiter) return null

    return {
      stats: {
        activeJobs: stats.recruiter.activeJobs,
        totalApplications: stats.recruiter.totalApplications,
        pendingApplications: stats.recruiter.pendingApplications,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('job') || a.type.includes('application')).slice(0, 5),
    }
  }

  const getBuyerData = () => {
    if (!stats?.buyer) return null

    return {
      stats: {
        totalOrders: stats.buyer.totalOrders,
        pendingOrders: stats.buyer.pendingOrders,
        totalSpent: stats.buyer.totalSpent,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('order') || a.type.includes('product')).slice(0, 5),
    }
  }

  const getSellerData = () => {
    if (!stats?.seller) return null

    return {
      stats: {
        activeProducts: stats.seller.activeProducts,
        totalOrders: stats.seller.totalOrders,
        totalEarnings: stats.seller.totalEarnings,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('order') || a.type.includes('product')).slice(0, 5),
    }
  }

  const handleManageJob = (job: any) => {
    setSelectedJob(job)
    setManageModalOpen(true)
  }

  const handleEditJob = (jobId: string) => {
    router.push(`/opportunities/edit/${jobId}`)
  }

  const handleManageProduct = (product: any) => {
    setSelectedProduct(product)
    setManageProductModalOpen(true)
  }

  const handleEditProduct = (productId: string) => {
    router.push(`/marketplace/edit/${productId}`)
  }

  const handleDeleteProduct = async (productId: string) => {
    refetchProducts()
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/opportunities/${jobId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        notifications.showSuccess("Job Deleted", "The job posting has been removed")
        setManageModalOpen(false)
        // Refresh the page to update the job list
        window.location.reload()
      } else {
        notifications.showError("Delete Failed", "Failed to delete job posting")
      }
    } catch (error) {
      notifications.showError("Error", "An error occurred while deleting the job")
    }
  }

  // Get role-specific data
  const workerData = getWorkerData()
  const recruiterData = getRecruiterData()
  const buyerData = getBuyerData()

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "worker":
        return {
          title: "Member Dashboard",
          subtitle: "Find jobs and track your agricultural work",
          primaryAction: "Find New Jobs",
          primaryIcon: Briefcase,
        }
      case "recruiter":
        return {
          title: "Employer Dashboard",
          subtitle: "Post jobs and manage your hiring process",
          primaryAction: "Post New Job",
          primaryIcon: Plus,
        }
      case "buyer":
        return {
          title: "Trader Dashboard",
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error loading dashboard: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Role Switcher */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Welcome back, {user.name ? user.name.split(" ")[0] : "User"}!</h1>
            <p className="text-muted-foreground">{config.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Removed Bell Notification Button */}
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
              Member
            </TabsTrigger>
            <TabsTrigger value="recruiter" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employer
            </TabsTrigger>
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Trader
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
                  <div className="text-2xl font-bold">{stats?.worker?.acceptedJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently working</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.worker?.activeApplications || 0}</div>
                  <p className="text-xs text-muted-foreground">Total applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.user?.trust_score || 0}</div>
                  <p className="text-xs text-muted-foreground">Trust score</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.reviewsReceived || 0}</div>
                  <p className="text-xs text-muted-foreground">Reviews received</p>
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
                    {workerData?.recentActivities && workerData.recentActivities.length > 0 ? (
                      workerData.recentActivities.map((activity) => {
                        const getBadge = (type: string) => {
                          switch (type) {
                            case 'application_accepted':
                              return { label: 'Accepted', className: 'bg-green-50 text-green-700 border-green-200' }
                            case 'application_rejected':
                              return { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' }
                            case 'application_submitted':
                            default:
                              return { label: 'Submitted', className: 'bg-amber-50 text-amber-700 border-amber-200' }
                          }
                        }
                        const badge = getBadge(activity.type)
                        return (
                          <article
                            key={activity.timestamp}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4 bg-card"
                          >
                            <div className="space-y-1 flex-1">
                              <h4 className="font-medium">{activity.title}</h4>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={badge.className}>{badge.label}</Badge>
                            </div>
                          </article>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No recent job activities. Start applying for jobs to see your activity here.
                      </p>
                    )}
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
                        <span>Trust Score</span>
                        <span>{workerData?.stats.trustScore || 0}/100</span>
                      </div>
                      <Progress value={workerData?.stats.trustScore || 0} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      {workerData?.stats.verified ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not Verified
                        </Badge>
                      )}
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
                    <CardTitle className="font-heading">Job Statistics</CardTitle>
                    <CardDescription>Your job application performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {workerData?.stats.activeJobs || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Active Jobs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {workerData?.stats.pendingApplications || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Award className="mr-2 h-4 w-4" />
                      View All Applications
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
                  <div className="text-2xl font-bold">{stats?.recruiter?.activeJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently posted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recruiter?.totalApplications || 0}</div>
                  <p className="text-xs text-muted-foreground">All applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hired Workers</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats?.recruiter as any)?.hiredWorkers || 0}</div>
                  <p className="text-xs text-muted-foreground">Accepted applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.reviewsReceived || 0}</div>
                  <p className="text-xs text-muted-foreground">Reviews received</p>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Active Job Postings */}
              <section className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-heading">Active Job Postings</CardTitle>
                      <CardDescription>Monitor your current job listings and applications</CardDescription>
                    </div>
                    <Link href="/opportunities/post">
                      <Button size="sm">
                        <Plus className="mr-1 h-4 w-4" />
                        Post Job
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recruiterLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
                    ) : recruiterJobs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">You haven't posted any jobs yet.</p>
                        <Link href="/opportunities/post">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Post Your First Job
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      recruiterJobs.map((job) => {
                        const daysAgo = formatRelativeTime(job.created_at)
                        return (
                          <article
                            key={job._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h4 className="font-medium">{job.title}</h4>
                                <Badge variant={job.urgency === "high" ? "destructive" : job.urgency === "medium" ? "default" : "secondary"}>
                                  {job.urgency} priority
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Posted {daysAgo}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/opportunities/${job._id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 sm:flex-none bg-transparent"
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="flex-1 sm:flex-none"
                                onClick={() => handleManageJob(job)}
                              >
                                Manage
                              </Button>
                            </div>
                          </article>
                        )
                      })
                    )}
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
                    {recruiterLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading...</div>
                    ) : recentApplicants.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">No recent applicants</div>
                    ) : (
                      recentApplicants.map((applicant) => {
                        const rating = (applicant.worker.trust_score / 20).toFixed(1)
                        return (
                          <article key={applicant._id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{applicant.worker.full_name}</h5>
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span>{rating}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{applicant.opportunity.title}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant={
                                applicant.status === "accepted" ? "default" : 
                                applicant.status === "rejected" ? "destructive" : 
                                "secondary"
                              }>
                                {applicant.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(applicant.created_at)}
                              </span>
                            </div>
                          </article>
                        )
                      })
                    )}
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
                  <div className="text-2xl font-bold">{stats?.buyer?.pendingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.buyer?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">All time orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.seller?.activeProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Active listings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₱{(stats?.seller?.totalEarnings || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">From sales</p>
                </CardContent>
              </Card>
            </section>

            {/* My Products Section */}
            <section>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-heading">My Products</CardTitle>
                    <CardDescription>Manage your product listings</CardDescription>
                  </div>
                  <Link href="/marketplace/sell">
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" />
                      List Product
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buyerLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                  ) : buyerProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-4">You haven't listed any products yet.</p>
                      <Link href="/marketplace/sell">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          List Your First Product
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {buyerProducts.map((product) => {
                        const daysAgo = formatRelativeTime(product.created_at)
                        const imageUrl = product.images?.[0] || "/placeholder.svg"
                        return (
                          <article
                            key={product._id}
                            className="flex flex-col p-4 border rounded-lg gap-3"
                          >
                            <img
                              src={imageUrl}
                              alt={product.title}
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium line-clamp-1">{product.title}</h4>
                                <Badge variant={
                                  product.status === "active" ? "default" :
                                  product.status === "pending_approval" ? "secondary" :
                                  "outline"
                                }>
                                  {product.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">₱{product.price}</span>
                                <span>•</span>
                                <span>{product.quantity_available} {product.unit}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {product.views} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {daysAgo}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/marketplace/${product._id}`} className="flex-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-transparent"
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleManageProduct(product)}
                              >
                                Manage
                              </Button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <div className="flex gap-6 lg:flex-row">
              {/* Left Column - Orders and Sales */}
              <div className="flex-1 space-y-6">
                {/* Recent Orders */}
                <section>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Orders</CardTitle>
                    <CardDescription>Track your current and recent purchases</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    {buyerOrdersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
                    ) : buyerOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">No recent orders found.</p>
                        <Link href="/marketplace">
                          <Button>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Browse Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      buyerOrders.map((order) => {
                        const daysAgo = formatRelativeTime(order.created_at)
                        const imageUrl = order.product_id?.images?.[0] || "/placeholder.svg"
                        return (
                          <article
                            key={order._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-3">
                                <img
                                  src={imageUrl}
                                  alt={order.product_id?.title || "Product"}
                                  className="w-12 h-12 object-cover rounded-md"
                                />
                                <div className="space-y-1">
                                  <h4 className="font-medium">{order.product_id?.title || "Unknown Product"}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {order.quantity} {order.product_id?.unit || "units"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Seller: {order.seller_id?.full_name || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                              <div className="text-right">
                                <div className="font-medium">₱{order.total_price.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">{daysAgo}</div>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={
                                  order.status === "delivered" ? "default" :
                                  order.status === "shipped" ? "secondary" :
                                  order.status === "confirmed" ? "outline" :
                                  order.status === "cancelled" ? "destructive" :
                                  "secondary"
                                }>
                                  {order.status}
                                </Badge>
                                <Badge variant={
                                  order.payment_status === "paid" ? "default" :
                                  order.payment_status === "failed" ? "destructive" :
                                  "secondary"
                                }>
                                  {order.payment_status}
                                </Badge>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
                </section>

                {/* Recent Sales */}
                <section>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Sales</CardTitle>
                    <CardDescription>Track your recent product sales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    {sellerOrdersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading sales...</div>
                    ) : sellerOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">No recent sales found.</p>
                        <Link href="/marketplace">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            List Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      sellerOrders.map((order) => {
                        const daysAgo = formatRelativeTime(order.created_at)
                        const imageUrl = order.product_id?.images?.[0] || "/placeholder.svg"
                        return (
                          <article
                            key={order._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-3">
                                <img
                                  src={imageUrl}
                                  alt={order.product_id?.title || "Product"}
                                  className="w-12 h-12 object-cover rounded-md"
                                />
                                <div className="space-y-1">
                                  <h4 className="font-medium">{order.product_id?.title || "Unknown Product"}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {order.quantity} {order.product_id?.unit || "units"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Buyer: {order.buyer_id?.full_name || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                              <div className="text-right">
                                <div className="font-medium">₱{order.total_price.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">{daysAgo}</div>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={
                                  order.status === "delivered" ? "default" :
                                  order.status === "shipped" ? "secondary" :
                                  order.status === "confirmed" ? "outline" :
                                  order.status === "cancelled" ? "destructive" :
                                  "secondary"
                                }>
                                  {order.status}
                                </Badge>
                                <Badge variant={
                                  order.payment_status === "paid" ? "default" :
                                  order.payment_status === "failed" ? "destructive" :
                                  "secondary"
                                }>
                                  {order.payment_status}
                                </Badge>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
                </section>
              </div>

              {/* Featured Products */}
              <section className="lg:w-80">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="font-heading">Featured Products</CardTitle>
                    <CardDescription>Fresh picks from local suppliers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {featuredProductsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                    ) : featuredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">No featured products found.</p>
                        <Link href="/marketplace">
                          <Button>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Browse All Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      featuredProducts.map((product) => {
                        console.log("Featured product data:", product)
                        const imageUrl = product.images?.[0] || "/placeholder.svg"
                        const daysAgo = formatRelativeTime(product.created_at)
                        return (
                          <article key={product._id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                            <div className="flex gap-3">
                              <img
                                src={imageUrl}
                                alt={product.title}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1 space-y-2">
                                <h5 className="font-medium text-base">{product.title}</h5>
                                <p className="text-sm text-muted-foreground">{product.seller_id?.full_name || "Unknown Seller"}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{product.rating || 4.5}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">{product.seller_id?.location || "Unknown"}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{daysAgo}</p>
                                <p className="text-xs text-muted-foreground">Category: {product.category || "General"}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-primary">₱{product.price.toLocaleString()}/{product.unit}</span>
                              <Button
                                size="sm"
                                onClick={() => {
                                  notifications.showInfo("Add to Cart", `Adding ${product.title} to cart...`)
                                  router.push(`/marketplace/product/${product._id}`)
                                }}
                              >
                                View Product
                              </Button>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </header>

      {/* Manage Job Modal */}
      {selectedJob && (
        <ManageJobModal
          job={selectedJob}
          open={manageModalOpen}
          onClose={() => {
            setManageModalOpen(false)
            setSelectedJob(null)
          }}
          onEdit={handleEditJob}
          onDelete={handleDeleteJob}
        />
      )}

      {selectedProduct && (
        <ManageProductModal
          product={selectedProduct}
          open={manageProductModalOpen}
          onClose={() => {
            setManageProductModalOpen(false)
            setSelectedProduct(null)
          }}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  )
}
